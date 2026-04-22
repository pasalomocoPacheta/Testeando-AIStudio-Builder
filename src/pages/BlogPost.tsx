import * as React from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

interface BlogPostData {
  title: string;
  description: string;
  keywords?: string;
  content: string;
  author: string;
  date: string;
  image?: string;
  slug: string;
}

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = React.useState<BlogPostData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchPost() {
      try {
        const response = await fetch(`/api/blog/${slug}`);
        if (!response.ok) {
          throw new Error('Post not found');
        }
        const data = await response.json();
        setPost(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
        <h2 className="text-2xl font-bold mb-4">Post no encontrado</h2>
        <p className="text-gray-600 mb-8">{error || 'El artículo que buscas no existe o ha sido movido.'}</p>
        <a href="/" className="px-6 py-2 bg-primary text-white rounded-full hover:opacity-90 transition-opacity">
          Volver al inicio
        </a>
      </div>
    );
  }

  return (
    <motion.article 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 py-12 md:py-20 font-body"
    >
      <header className="mb-12">
        {post.image && (
          <div className="aspect-video w-full mb-8 rounded-3xl overflow-hidden shadow-2xl">
            <img 
              src={post.image} 
              alt={post.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm text-gray-500 font-mono">
            <span>{new Date(post.date).toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
            <span>•</span>
            <span>{post.author}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-heading uppercase leading-tight">
            {post.title}
          </h1>
          {post.description && (
            <p className="text-xl text-gray-600 leading-relaxed italic">
              {post.description}
            </p>
          )}
        </div>
      </header>

      <div 
        className="prose prose-xl max-w-none prose-img:rounded-3xl prose-img:shadow-lg"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </motion.article>
  );
};

export default BlogPost;
