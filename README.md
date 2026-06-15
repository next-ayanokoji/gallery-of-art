# Artistry Gallery - Full-Stack Artwork Gallery Website

A premium dark-themed artwork gallery website built with Node.js, Express, MongoDB, and Cloudinary. Features a modern glassmorphism design, responsive layout, and comprehensive admin panel for managing artwork collections.

## 🎨 Features

### User Side
- **Modern Dark Aesthetic UI** - Premium dark theme with glassmorphism effects
- **Responsive Design** - Fully responsive for mobile and desktop devices
- **Artwork Gallery** - Beautiful card-based gallery with hover animations
- **Artwork Details** - Display image, title, caption, category, and upload date
- **Search Functionality** - Search artworks by title or caption
- **Category Filtering** - Filter by painting, sculpture, photography, digital, mixed-media
- **Image Preview Modal** - Full-screen modal for viewing artwork details

### Admin Panel
- **Secure Authentication** - JWT-based authentication with bcrypt password hashing
- **Admin Dashboard** - Overview with total artworks count and statistics
- **Upload Artwork** - Upload new artworks with image, title, caption, and category
- **Edit Artwork** - Update artwork details and images
- **Delete Artwork** - Remove artworks from the gallery
- **Manage Collection** - Table view of all uploaded artworks
- **Logout Functionality** - Secure logout with token cleanup

## 🛠 Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Cloudinary** - Cloud image storage
- **Multer** - File upload handling

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling with glassmorphism effects
- **JavaScript (Vanilla)** - No frameworks, pure JS
- **Google Fonts** - Inter and Playfair Display fonts

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn** package manager
- **Cloudinary Account** (free tier available)

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd artwork-gallery
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required backend dependencies:
- express
- mongoose
- cors
- dotenv
- jsonwebtoken
- bcryptjs
- cloudinary
- multer
- multer-storage-cloudinary

### 3. Set Up MongoDB

#### Option A: Local MongoDB
1. Install MongoDB on your system
2. Start MongoDB service:
   ```bash
   # On Windows
   net start MongoDB
   
   # On macOS/Linux
   sudo systemctl start mongod
   ```

#### Option B: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Whitelist your IP address

### 4. Set Up Cloudinary

1. Create a free account at [Cloudinary](https://cloudinary.com)
2. Sign in to your dashboard
3. Navigate to Settings > API Security
4. Note down:
   - Cloud Name
   - API Key
   - API Secret

### 5. Configure Environment Variables

1. Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```

2. Edit the `.env` file with your configuration:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/artwork-gallery
# Or use MongoDB Atlas connection string:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/artwork-gallery

# JWT Secret Key (Generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Server Configuration
PORT=5000
```

**Important:** Generate a secure JWT secret using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6. Start the Development Server

```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

The server will start on `http://localhost:5000`

### 7. Access the Application

- **User Gallery**: http://localhost:5000
- **Admin Login**: http://localhost:5000/admin
- **Admin Dashboard**: http://localhost:5000/admin/dashboard

## 👤 Initial Admin Setup

### Register First Admin

1. Navigate to http://localhost:5000/admin
2. Click "Register as Admin"
3. Fill in the registration form:
   - Username
   - Email
   - Password (minimum 6 characters)
4. Click "Register"
5. You'll be automatically logged in and redirected to the dashboard

### Subsequent Logins

1. Navigate to http://localhost:5000/admin
2. Enter your username and password
3. Click "Sign In"

## 📁 Project Structure

```
artwork-gallery/
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── models/
│   ├── Artwork.js           # Artwork MongoDB schema
│   └── User.js              # User MongoDB schema
├── public/
│   ├── css/
│   │   └── style.css        # Main stylesheet with dark theme
│   ├── js/
│   │   ├── gallery.js       # Gallery functionality
│   │   ├── admin-login.js   # Admin login/register logic
│   │   └── dashboard.js     # Admin dashboard logic
│   ├── admin.html           # Admin login page
│   ├── dashboard.html       # Admin dashboard page
│   └── index.html           # User gallery page
├── routes/
│   ├── artwork.js           # Artwork CRUD routes
│   └── auth.js              # Authentication routes
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── package.json             # Project dependencies
├── README.md                # This file
└── server.js                # Main server file
```

## 🔌 API Endpoints

### Authentication

#### Register Admin
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "admin",
  "email": "admin@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Artworks

#### Get All Artworks
```http
GET /api/artworks?category=painting&search=keyword
```

#### Get Single Artwork
```http
GET /api/artworks/:id
```

#### Create Artwork (Admin Only)
```http
POST /api/artworks
Authorization: Bearer <token>
Content-Type: multipart/form-data

title: "Artwork Title"
caption: "Artwork description"
category: "painting"
image: <file>
```

#### Update Artwork (Admin Only)
```http
PUT /api/artworks/:id
Authorization: Bearer <token>
Content-Type: multipart/form-data

title: "Updated Title"
caption: "Updated description"
category: "digital"
image: <file> (optional)
```

#### Delete Artwork (Admin Only)
```http
DELETE /api/artworks/:id
Authorization: Bearer <token>
```

#### Get Statistics (Admin Only)
```http
GET /api/artworks/stats/summary
Authorization: Bearer <token>
```

## 🎨 Design Features

### Dark Theme
- Deep black and purple color palette
- High contrast for excellent readability
- Smooth transitions and animations

### Glassmorphism
- Frosted glass effect on cards and modals
- Backdrop blur for depth
- Subtle borders and shadows

### Responsive Design
- Mobile-first approach
- Breakpoints for tablet and desktop
- Touch-friendly interactions

### Typography
- **Playfair Display** - Elegant serif for headings
- **Inter** - Clean sans-serif for body text
- Optimized for readability

## 🔒 Security Features

- **Password Hashing** - bcrypt with salt rounds
- **JWT Authentication** - Secure token-based auth
- **Protected Routes** - Middleware for admin-only endpoints
- **Input Validation** - Server-side validation
- **XSS Protection** - HTML escaping in frontend
- **File Upload Security** - Type and size validation

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check your connection string in `.env`
- Verify IP whitelist if using MongoDB Atlas

### Cloudinary Upload Issues
- Verify your Cloudinary credentials
- Check your API key permissions
- Ensure image format is supported (JPG, PNG, WebP, GIF)

### Authentication Issues
- Clear browser localStorage
- Verify JWT_SECRET in `.env`
- Check token expiration (7 days)

### Port Already in Use
```bash
# Find process using port 5000
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # macOS/Linux

# Kill the process or change PORT in .env
```

## 🚀 Deployment

### Deploy to Vercel/Heroku/Render

1. Push code to GitHub
2. Connect your repository to the deployment platform
3. Set environment variables in the platform's dashboard
4. Deploy

### Environment Variables for Production
```env
MONGODB_URI=<production-mongodb-uri>
JWT_SECRET=<strong-random-secret>
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
PORT=5000
```

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, please open an issue in the repository or contact the development team.

## 🎯 Future Enhancements

- [ ] User accounts and favorites
- [ ] Artwork comments and ratings
- [ ] Advanced search with filters
- [ ] Artist profiles
- [ ] Social sharing integration
- [ ] Email notifications
- [ ] Image editing tools
- [ ] Bulk upload functionality
- [ ] Export/backup functionality
- [ ] Multi-language support

---

Built with ❤️ using modern web technologies
# gallery-of-art
# gallery-of-art
