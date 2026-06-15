/**
 * Artwork Routes
 * Handles CRUD operations for artworks with Cloudinary image upload
 */

const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const Artwork = require('../models/Artwork');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'artwork-gallery',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto' }
        ]
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp|gif/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(file.originalname.toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed'));
    }
});

// @route   GET /api/artworks
// @desc    Get all artworks with optional filtering
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { category, search } = req.query;
        
        let query = {};
        
        // Filter by category
        if (category && category !== 'all') {
            query.category = category;
        }
        
        // Search by title or caption
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { caption: { $regex: search, $options: 'i' } }
            ];
        }
        
        const artworks = await Artwork.find(query)
            .sort({ createdAt: -1 })
            .select('-cloudinaryId');
        
        res.json({
            success: true,
            count: artworks.length,
            artworks
        });
    } catch (error) {
        console.error('Get artworks error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching artworks',
            error: error.message
        });
    }
});

// @route   GET /api/artworks/:id
// @desc    Get single artwork by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const artwork = await Artwork.findById(req.params.id).select('-cloudinaryId');
        
        if (!artwork) {
            return res.status(404).json({
                success: false,
                message: 'Artwork not found'
            });
        }
        
        res.json({
            success: true,
            artwork
        });
    } catch (error) {
        console.error('Get artwork error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching artwork',
            error: error.message
        });
    }
});

// @route   POST /api/artworks
// @desc    Create new artwork with image upload
// @access  Private (Admin only)
router.post('/', protect, admin, upload.single('image'), async (req, res) => {
    try {
        const { title, caption, category } = req.body;
        
        // Validate input
        if (!title || !caption || !category) {
            return res.status(400).json({
                success: false,
                message: 'Please provide title, caption, and category'
            });
        }
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an image'
            });
        }
        
        // Create artwork
        const artwork = await Artwork.create({
            title,
            caption,
            category,
            imageUrl: req.file.path,
            cloudinaryId: req.file.filename
        });
        
        res.status(201).json({
            success: true,
            message: 'Artwork created successfully',
            artwork
        });
    } catch (error) {
        console.error('Create artwork error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating artwork',
            error: error.message
        });
    }
});

// @route   PUT /api/artworks/:id
// @desc    Update artwork details
// @access  Private (Admin only)
router.put('/:id', protect, admin, upload.single('image'), async (req, res) => {
    try {
        const { title, caption, category } = req.body;
        
        const artwork = await Artwork.findById(req.params.id);
        
        if (!artwork) {
            return res.status(404).json({
                success: false,
                message: 'Artwork not found'
            });
        }
        
        // Update fields
        if (title) artwork.title = title;
        if (caption) artwork.caption = caption;
        if (category) artwork.category = category;
        
        // Update image if new one is uploaded
        if (req.file) {
            // Delete old image from Cloudinary
            await cloudinary.uploader.destroy(artwork.cloudinaryId);
            
            // Update with new image
            artwork.imageUrl = req.file.path;
            artwork.cloudinaryId = req.file.filename;
        }
        
        await artwork.save();
        
        res.json({
            success: true,
            message: 'Artwork updated successfully',
            artwork
        });
    } catch (error) {
        console.error('Update artwork error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating artwork',
            error: error.message
        });
    }
});

// @route   DELETE /api/artworks/:id
// @desc    Delete artwork and its image from Cloudinary
// @access  Private (Admin only)
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const artwork = await Artwork.findById(req.params.id);
        
        if (!artwork) {
            return res.status(404).json({
                success: false,
                message: 'Artwork not found'
            });
        }
        
        // Delete image from Cloudinary
        await cloudinary.uploader.destroy(artwork.cloudinaryId);
        
        // Delete artwork from database
        await artwork.deleteOne();
        
        res.json({
            success: true,
            message: 'Artwork deleted successfully'
        });
    } catch (error) {
        console.error('Delete artwork error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting artwork',
            error: error.message
        });
    }
});

// @route   GET /api/artworks/stats/summary
// @desc    Get artwork statistics
// @access  Private (Admin only)
router.get('/stats/summary', protect, admin, async (req, res) => {
    try {
        const totalArtworks = await Artwork.countDocuments();
        
        const artworksByCategory = await Artwork.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);
        
        res.json({
            success: true,
            stats: {
                totalArtworks,
                artworksByCategory
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
});

module.exports = router;
