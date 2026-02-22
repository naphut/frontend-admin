import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Link as LinkIcon, X, Star, Image as ImageIcon, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/adminApi';

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

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [imageLink, setImageLink] = useState('');
  const [images, setImages] = useState<ProductImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    compare_price: '',
    stock: '',
    sku: '',
    featured: false,
    is_active: true,
    category_ids: [] as number[],
  });

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchCategories();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const data = await adminApi.getProduct(Number(id));
      setFormData({
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        price: String(data.price ?? ''),
        compare_price: data.compare_price != null ? String(data.compare_price) : '',
        stock: String(data.stock ?? ''),
        sku: data.sku || '',
        featured: Boolean(data.featured),
        is_active: Boolean(data.is_active),
        category_ids: Array.isArray(data.categories) ? data.categories.map((c: Category) => c.id) : [],
      });

      if (Array.isArray(data.images)) {
        // Ensure sort_order and primary are normalized
        const normalized = [...data.images]
          .map((img: any, idx: number) => ({
            id: img.id,
            url: img.url,
            alt_text: img.alt_text || undefined,
            is_primary: Boolean(img.is_primary),
            sort_order: typeof img.sort_order === 'number' ? img.sort_order : idx,
          }))
          .sort((a, b) => a.sort_order - b.sort_order);
        if (normalized.length > 0 && !normalized.some(i => i.is_primary)) {
          normalized[0].is_primary = true;
        }
        setImages(normalized);
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Failed to load product');
      navigate('/products');
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await adminApi.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

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
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large (max 5MB)`);
        return false;
      }
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

      for (const file of validFiles) {
        const fd = new FormData();
        fd.append('file', file);

        const response = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: fd,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.detail || `Failed to upload ${file.name}`);
        }

        const data = await response.json();
        const newImage: ProductImage = {
          url: data.url,
          alt_text: file.name,
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (files.length > 1) {
      await handleMultipleImageUpload(files);
      return;
    }
    await handleMultipleImageUpload(files);
    e.target.value = '';
  };

  const handleAddImageLink = () => {
    if (!imageLink.trim()) {
      toast.error('Please enter an image URL');
      return;
    }
    try {
      new URL(imageLink);
    } catch {
      toast.error('Invalid URL format');
      return;
    }

    const newImage: ProductImage = {
      url: imageLink,
      alt_text: formData.name || 'Product image',
      is_primary: images.length === 0,
      sort_order: images.length,
    };
    setImages(prev => [...prev, newImage]);
    setImageLink('');
    setShowLinkInput(false);
    toast.success('Image link added successfully');
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    if (images[index]?.is_primary && newImages.length > 0) {
      newImages[0].is_primary = true;
    }
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

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast.error('Price must be a positive number');
      return;
    }
    const stock = parseInt(formData.stock);
    if (isNaN(stock) || stock < 0) {
      toast.error('Stock must be a positive number');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        price,
        compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
        stock,
        sku: formData.sku || null,
        featured: formData.featured,
        is_active: formData.is_active,
        category_ids: formData.category_ids,
        images: images.map((img, idx) => ({
          url: img.url,
          alt_text: img.alt_text || null,
          is_primary: Boolean(img.is_primary),
          sort_order: typeof img.sort_order === 'number' ? img.sort_order : idx,
        })),
      };

      await adminApi.updateProduct(Number(id), payload);
      toast.success('Product updated successfully');
      navigate('/products');
    } catch (error: any) {
      console.error('Failed to update product:', error);
      toast.error(error.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/products')}
        className="flex items-center space-x-2 text-gray-600 hover:text-black mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Products</span>
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Product</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
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
                  Slug *
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compare Price
                </label>
                <input
                  type="number"
                  name="compare_price"
                  value={formData.compare_price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock *
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categories
                </label>
                <select
                  multiple
                  value={formData.category_ids.map(String)}
                  onChange={handleCategoryChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                  size={4}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="text-sm text-gray-700">Featured Product</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h2>

            {images.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">Current Images ({images.length})</h3>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <ImageIcon className="w-4 h-4" />
                    <span>Set primary with star</span>
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
                            e.currentTarget.src = 'https://via.placeholder.com/150?text=Error';
                          }}
                        />
                      </div>

                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
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

                      {image.is_primary && (
                        <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1 shadow-lg">
                          <Star className="w-3 h-3" />
                          <span>Primary</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                  <p className="text-sm text-gray-500 mt-1">or click to browse files</p>
                </div>

                {!uploading && (
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>JPG, PNG, GIF, WEBP</span>
                    </div>
                    <span>Max 5MB per file</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowLinkInput(!showLinkInput)}
                disabled={uploading}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <LinkIcon className="w-4 h-4" />
                <span>Add Image URL</span>
              </button>
            </div>

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
          </div>
        </div>

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
            className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductEdit;