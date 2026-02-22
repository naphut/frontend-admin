import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { ArrowLeft, Upload, Link as LinkIcon, X, Star, Image as ImageIcon, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
}

interface ProductImage {
  id?: number;
  url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
}

const ProductForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [imageLink, setImageLink] = useState('');
  const [images, setImages] = useState<ProductImage[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    compare_price: '',
    stock: '',
    sku: '',
    brand: '',
    featured: false,
    is_active: true,
    category_ids: [] as number[],
  });

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await adminApi.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checkbox.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(opt => Number(opt.value));
    setFormData(prev => ({ ...prev, category_ids: selectedOptions }));
  };

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  // ========== IMAGE HANDLERS ==========

  // Drag and Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleMultipleImageUpload(files);
    }
  };

  const handleMultipleImageUpload = async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large (max 5MB)`);
        return false;
      }
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} is not an image`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      toast.error('No valid images to upload');
      return;
    }

    setUploading(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      
      // Upload each file sequentially
      for (const file of validFiles) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || `Failed to upload ${file.name}`);
        }
        
        const data = await response.json();
        
        const newImage: ProductImage = {
          url: data.url,
          alt_text: file.name || 'Product image',
          is_primary: images.length === 0,
          sort_order: images.length,
        };
        
        setImages(prev => [...prev, newImage]);
      }
      
      toast.success(`${validFiles.length} image(s) uploaded successfully`);
    } catch (error: any) {
      console.error('Failed to upload images:', error);
      toast.error(error.message || 'Failed to upload images');
    } finally {
      setUploading(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSelectedFiles(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // If multiple files selected, use multiple upload
    if (files.length > 1) {
      handleMultipleImageUpload(files);
      return;
    }

    // Single file upload (existing logic)
    const file = files[0];
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('File must be an image');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('adminToken');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
      }
      
      const data = await response.json();
      
      const newImage: ProductImage = {
        url: data.url,
        alt_text: file.name || 'Product image',
        is_primary: images.length === 0,
        sort_order: images.length,
      };
      
      setImages([...images, newImage]);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleAddImageLink = () => {
    if (!imageLink.trim()) {
      toast.error('Please enter an image URL');
      return;
    }

    // Validate URL format
    try {
      new URL(imageLink);
    } catch {
      toast.error('Invalid URL format');
      return;
    }

    // More flexible image URL validation
    // Check for common image patterns or file extensions
    const imagePatterns = [
      /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff?)$/i,  // File extensions
      /\/image\//i,                                 // Common CDN patterns
      /\/photos\//i,                                // Facebook/Instagram
      /\/img\//i,                                  // General image paths
      /picsum\.photos/i,                            // Placeholder services
      /unsplash\.com/i,                             // Unsplash
      /placehold\.co/i,                             // Placeholder services
      /via\.placeholder\.com/i                      // Placeholder services
    ];
    
    const isLikelyImage = imagePatterns.some(pattern => pattern.test(imageLink));
    
    if (!isLikelyImage) {
      // Still allow it but show a warning
      if (!confirm('This URL might not be an image. Do you want to continue?')) {
        return;
      }
    }

    const newImage: ProductImage = {
      url: imageLink,
      alt_text: formData.name || 'Product image',
      is_primary: images.length === 0,
      sort_order: images.length,
    };

    setImages([...images, newImage]);
    setImageLink('');
    setShowLinkInput(false);
    toast.success('Image link added successfully');
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    
    // If we removed the primary image and there are other images,
    // make the first one primary
    if (images[index].is_primary && newImages.length > 0) {
      newImages[0].is_primary = true;
    }
    
    // Update sort_order for remaining images
    newImages.forEach((img, i) => {
      img.sort_order = i;
    });
    
    setImages(newImages);
    toast.success('Image removed');
  };

  const handleSetPrimary = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      is_primary: i === index,
    }));
    setImages(newImages);
    toast.success('Primary image set');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name) {
      toast.error('Product name is required');
      return;
    }
    if (!formData.slug) {
      toast.error('Slug is required');
      return;
    }
    if (!formData.price) {
      toast.error('Price is required');
      return;
    }
    if (!formData.stock) {
      toast.error('Stock is required');
      return;
    }

    // Validate price is a positive number
    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast.error('Price must be a positive number');
      return;
    }

    // Validate stock is a positive integer
    const stock = parseInt(formData.stock);
    if (isNaN(stock) || stock < 0) {
      toast.error('Stock must be a positive number');
      return;
    }

    setLoading(true);

    try {
      // រៀបចំទិន្នន័យឲ្យត្រូវនឹង Backend schema
      const productData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        price: parseFloat(formData.price),
        compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
        stock: parseInt(formData.stock),
        sku: formData.sku || null,
        brand: formData.brand || null,
        featured: formData.featured,
        is_active: formData.is_active,
        category_ids: formData.category_ids,
        images: images.map(img => ({
          url: img.url,
          alt_text: img.alt_text || null,
          is_primary: img.is_primary,
          sort_order: img.sort_order,
        })),
      };
      
      console.log('========== SUBMITTING PRODUCT ==========');
      console.log('Product Data:', JSON.stringify(productData, null, 2));
      console.log('=========================================');
      
      const response = await adminApi.createProduct(productData);
      console.log('Create product response:', response);
      
      toast.success('Product created successfully');
      navigate('/products');
    } catch (error: any) {
      console.error('Failed to create product:', error);
      
      // បង្ហាញ error message ពី server
      if (error.message.includes('slug')) {
        toast.error('This slug already exists. Please use a different slug.');
      } else if (error.message.includes('SKU')) {
        toast.error('This SKU already exists. Please use a different SKU.');
      } else {
        toast.error(error.message || 'Failed to create product');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/products')}
        className="flex items-center space-x-2 text-gray-600 hover:text-black mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Products</span>
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Add New Product</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          {/* Basic Information Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                  placeholder="e.g., Classic White T-Shirt"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                  placeholder="e.g., classic-white-t-shirt"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-generated from name. Must be unique.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                  placeholder="Enter product description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                  placeholder="e.g., Nike, Adidas, etc."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Product brand (optional)
                </p>
              </div>
            </div>
          </div>

          {/* Pricing and Stock Section */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Stock</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                  placeholder="29.99"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compare Price ($)
                </label>
                <input
                  type="number"
                  name="compare_price"
                  value={formData.compare_price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                  placeholder="39.99"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Original price before discount
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                  placeholder="TS-001"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Stock Keeping Unit (optional)
                </p>
              </div>
            </div>
          </div>

          {/* Categories Section */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
            <div>
              <select
                multiple
                value={formData.category_ids.map(String)}
                onChange={handleCategoryChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                size={4}
              >
                {categories.length === 0 ? (
                  <option disabled>No categories available</option>
                ) : (
                  categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))
                )}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Hold Ctrl/Cmd to select multiple categories
              </p>
            </div>
          </div>

          {/* Product Status Section */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Status</h2>
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-sm text-gray-700">Featured Product</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-sm text-gray-700">Active (Visible in store)</span>
              </label>
            </div>
          </div>

          {/* Images Section */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h2>
            
            {/* Image List */}
            {images.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">Current Images ({images.length})</h3>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <ImageIcon className="w-4 h-4" />
                    <span>First image is primary</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50">
                        <img
                          src={`http://localhost:8000${image.url}`}
                          alt={image.alt_text || 'Product image'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Image failed to load:', image.url);
                            e.currentTarget.src = 'https://via.placeholder.com/150?text=Error';
                          }}
                        />
                      </div>
                      
                      {/* Overlay Controls */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex flex-col space-y-2">
                          <div className="flex space-x-2">
                            {!image.is_primary && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimary(index)}
                                className="p-2 bg-white rounded-full hover:bg-yellow-100 transition-colors shadow-lg"
                                title="Set as primary image"
                              >
                                <Star className="w-4 h-4 text-yellow-600" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="p-2 bg-white rounded-full hover:bg-red-100 transition-colors shadow-lg"
                              title="Remove image"
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Primary Badge */}
                      {image.is_primary && (
                        <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1 shadow-lg">
                          <Star className="w-3 h-3" />
                          <span>Primary</span>
                        </div>
                      )}
                      
                      {/* Image Info */}
                      <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-75 text-white text-xs p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="truncate">{image.alt_text || 'Product image'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drag & Drop Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isDragging 
                  ? 'border-black bg-black/5' 
                  : 'border-gray-300 hover:border-gray-400 bg-gray-50'
              } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                onChange={handleImageUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              
              <div className="flex flex-col items-center space-y-4">
                <div className={`p-4 rounded-full ${isDragging ? 'bg-black/10' : 'bg-gray-100'}`}>
                  <Upload className={`w-8 h-8 ${isDragging ? 'text-black' : 'text-gray-400'}`} />
                </div>
                
                <div>
                  <p className={`text-lg font-medium ${isDragging ? 'text-black' : 'text-gray-700'}`}>
                    {uploading ? 'Uploading images...' : isDragging ? 'Drop images here' : 'Drag & drop images here'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    or click to browse files
                  </p>
                </div>
                
                {!uploading && (
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>JPG, PNG, GIF, WEBP</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>Max 5MB per file</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>Multiple files supported</span>
                    </div>
                  </div>
                )}
                
                {uploading && (
                  <div className="flex items-center space-x-2 text-sm text-black">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                    <span>Processing images...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Alternative Upload Methods */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {/* Image Link Button */}
              <button
                type="button"
                onClick={() => setShowLinkInput(!showLinkInput)}
                disabled={uploading}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <LinkIcon className="w-4 h-4" />
                <span>Add Image URL</span>
              </button>
              
              {/* Clear All Images */}
              {images.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to remove all images?')) {
                      setImages([]);
                      toast.success('All images removed');
                    }
                  }}
                  disabled={uploading}
                  className="flex items-center space-x-2 px-4 py-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {/* Image Link Input */}
            {showLinkInput && (
              <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex-1 w-full">
                    <input
                      type="url"
                      value={imageLink}
                      onChange={(e) => setImageLink(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter a direct URL to an image file
                    </p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleAddImageLink}
                      className="flex-1 sm:flex-none px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Add Image
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowLinkInput(false);
                        setImageLink('');
                      }}
                      className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Help Text */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-xs text-blue-700">
                  <p className="font-medium mb-1">Image Guidelines:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>First uploaded image will be set as primary automatically</li>
                    <li>You can change the primary image by clicking the star icon</li>
                    <li>Recommended size: 800x800px or larger for best quality</li>
                    <li>Supported formats: JPG, PNG, GIF, WEBP</li>
                    <li>Maximum file size: 5MB per image</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || uploading}
            className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
            ) : 'Create Product'}
          </button>
        </div>
      </form>
      
    </div>
  );
};

export default ProductForm;