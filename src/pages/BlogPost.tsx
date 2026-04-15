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
    return null;
  }

  if (error || !post) {
    return null;
  }

  return (
    <motion.article 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 py-12 md:py-20 font-body"
    >
      <div 
        className="prose prose-xl max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </motion.article>
  );
};

export default BlogPost;
