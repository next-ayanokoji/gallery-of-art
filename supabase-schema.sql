-- Supabase SQL Schema for Artwork Gallery
-- Run this in your Supabase project's SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users with additional fields)
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    username VARCHAR(50) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create artworks table
CREATE TABLE artworks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    caption VARCHAR(500) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('painting', 'sculpture', 'photography', 'digital', 'mixed-media', 'other')),
    image_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on category for faster filtering
CREATE INDEX idx_artworks_category ON artworks(category);
CREATE INDEX idx_artworks_created_at ON artworks(created_at DESC);
CREATE INDEX idx_artworks_uploaded_by ON artworks(uploaded_by);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_artworks_updated_at
    BEFORE UPDATE ON artworks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for artworks table
-- Allow public read access
CREATE POLICY "Allow public read access" ON artworks
    FOR SELECT
    USING (true);

-- Allow authenticated users to insert (admin check will be done in application)
CREATE POLICY "Allow authenticated insert" ON artworks
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update (admin check will be done in application)
CREATE POLICY "Allow authenticated update" ON artworks
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete (admin check will be done in application)
CREATE POLICY "Allow authenticated delete" ON artworks
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Create policies for users table
-- Allow authenticated users to read their own data
CREATE POLICY "Allow users to read own data" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Allow authenticated users to insert (for registration)
CREATE POLICY "Allow authenticated insert" ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create storage bucket for artwork images
INSERT INTO storage.buckets (id, name, public)
VALUES ('artwork-images', 'artwork-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
-- Allow public read access to images
CREATE POLICY "Allow public read images" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'artwork-images');

-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated upload images" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'artwork-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete images
CREATE POLICY "Allow authenticated delete images" ON storage.objects
    FOR DELETE
    USING (bucket_id = 'artwork-images' AND auth.role() = 'authenticated');

-- Allow public read access to avatars
CREATE POLICY "Allow public read avatars" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'user-avatars');

-- Allow authenticated users to upload avatars
CREATE POLICY "Allow authenticated upload avatars" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'user-avatars' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete avatars
CREATE POLICY "Allow authenticated delete avatars" ON storage.objects
    FOR DELETE
    USING (bucket_id = 'user-avatars' AND auth.role() = 'authenticated');
