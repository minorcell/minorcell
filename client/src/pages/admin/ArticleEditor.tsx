import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';

interface Tag {
  id: number;
  name: string;
}

interface ArticleForm {
  title: string;
  content: string;
  tags: number[];
  status: 'published' | 'draft';
}

const ArticleEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [form, setForm] = useState<ArticleForm>({
    title: '',
    content: '',
    tags: [],
    status: 'draft'
  });
  
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // 获取可用标签
    const fetchTags = async () => {
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const mockTags: Tag[] = [
          { id: 1, name: 'React' },
          { id: 2, name: 'TypeScript' },
          { id: 3, name: 'JavaScript' },
          { id: 4, name: 'Web开发' },
          { id: 5, name: '前端' },
        ];
        
        setAvailableTags(mockTags);
      } catch (error) {
        console.error('获取标签失败', error);
      }
    };
    
    fetchTags();
    
    // 如果是编辑模式，获取文章数据
    if (isEditing) {
      const fetchArticle = async () => {
        setLoading(true);
        try {
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // 模拟文章数据
          const mockArticle = {
            title: `文章 ${id} 的标题`,
            content: `这是文章 ${id} 的内容。\n\n这是第二段落。`,
            tags: [1, 3],
            status: 'published' as const
          };
          
          setForm(mockArticle);
        } catch (error) {
          console.error('获取文章失败', error);
          setError('获取文章数据失败');
        } finally {
          setLoading(false);
        }
      };
      
      fetchArticle();
    }
  }, [id, isEditing]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTagChange = (tagId: number) => {
    setForm(prev => {
      const isSelected = prev.tags.includes(tagId);
      if (isSelected) {
        return { ...prev, tags: prev.tags.filter(id => id !== tagId) };
      } else {
        return { ...prev, tags: [...prev.tags, tagId] };
      }
    });
  };
  
  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault();
    
    if (!form.title.trim()) {
      setError('标题不能为空');
      return;
    }
    
    if (!form.content.trim()) {
      setError('内容不能为空');
      return;
    }
    
    const articleData = {
      ...form,
      status: saveAsDraft ? 'draft' : form.status
    };
    
    setSaving(true);
    setError('');
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 成功后跳转到文章列表
      alert(isEditing ? '文章更新成功！' : '文章创建成功！');
      navigate('/manage/article/list');
    } catch (error) {
      console.error('保存文章失败', error);
      setError('保存文章失败，请稍后再试');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {isEditing ? '编辑文章' : '创建新文章'}
      </h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            文章标题
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="请输入文章标题"
            disabled={saving}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            文章内容
          </label>
          <textarea
            id="content"
            name="content"
            value={form.content}
            onChange={handleChange}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="请输入文章内容"
            disabled={saving}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            标签
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => (
              <label key={tag.id} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={form.tags.includes(tag.id)}
                  onChange={() => handleTagChange(tag.id)}
                  disabled={saving}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">{tag.name}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            状态
          </label>
          <select
            id="status"
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={saving}
          >
            <option value="draft">草稿</option>
            <option value="published">发布</option>
          </select>
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/manage/article/list')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={saving}
          >
            取消
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={saving}
          >
            保存为草稿
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={saving}
          >
            {saving ? '保存中...' : '保存并发布'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ArticleEditor;
