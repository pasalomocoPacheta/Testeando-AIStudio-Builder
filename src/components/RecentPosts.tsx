import * as React from 'react';
import { builder } from '@builder.io/react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

// Initialize Builder with the API Key (same as in server.ts)
const BUILDER_API_KEY = 'f450ca45929045f782ca4fdfb394abb9';
builder.init(BUILDER_API_KEY);

interface BlogPost {
  title: string;
  description: string;
  slug: string;
  date?: string;
  image?: string;
}

interface RecentPostsProps {
  title?: string;
  count?: number;
  maxDescriptionChars?: number;
  backgroundColor?: string;
  textColor?: string;
  lineColor?: string;
  linkColor?: string;
  linkHoverColor?: string;
  itemHoverBg?: string;
  readMoreColor?: string;
  readMoreHoverColor?: string;
  dateColor?: string;
  descriptionColor?: string;
  showImages?: boolean;
  showDates?: boolean;
}

interface BuilderContent {
  data?: {
    title?: string;
    description?: string;
    excerpt?: string;
    slug?: string;
    url?: string;
    date?: string;
    image?: string;
    featuredImage?: string;
    thumbnail?: string;
    content?: string;
    keywords?: string;
    author?: string;
  };
  name?: string;
  createdDate?: string;
}

const RecentPosts: React.FC<RecentPostsProps> = ({
  title = 'YOU MIGHT ALSO LIKE',
  count = 3,
  maxDescriptionChars = 120,
  backgroundColor = '#1C0445', // Dark violet from the theme
  textColor = '#FFFFFF',
  lineColor = 'rgba(255, 255, 255, 0.2)',
  linkColor = '#FFFFFF',
  linkHoverColor = '#00FF00', // Accent color
  itemHoverBg = 'rgba(255, 255, 255, 0.05)',
  readMoreColor = '#00FF00',
  readMoreHoverColor = '#FFFFFF',
  dateColor = 'rgba(255, 255, 255, 0.6)',
  descriptionColor = 'rgba(255, 255, 255, 0.8)',
  showImages = false,
  showDates = true,
}) => {
  const [posts, setPosts] = React.useState<BlogPost[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        const postCount = Number(count) || 3;
        
        // 1. Try fetching with sorting by date
        let apiUrl = `https://cdn.builder.io/api/v3/content/blog?apiKey=${BUILDER_API_KEY}&limit=${postCount}&sort.data.date=-1&noTargeting=true`;
        console.log('RecentPosts: Attempting fetch with sort:', apiUrl);

        let response = await fetch(apiUrl);
        let data = await response.json();
        let results: BuilderContent[] = data.results || [];

        // 2. Fallback: If no results, try fetching without sorting (maybe data.date doesn't exist)
        if (results.length === 0) {
          apiUrl = `https://cdn.builder.io/api/v3/content/blog?apiKey=${BUILDER_API_KEY}&limit=${postCount}&noTargeting=true`;
          console.log('RecentPosts: No results with sort, trying without sort:', apiUrl);
          response = await fetch(apiUrl);
          data = await response.json();
          results = data.results || [];
        }

        // 3. Fallback: If still no results, try model name 'post' just in case
        if (results.length === 0) {
          apiUrl = `https://cdn.builder.io/api/v3/content/post?apiKey=${BUILDER_API_KEY}&limit=${postCount}&noTargeting=true`;
          console.log('RecentPosts: No results with "blog", trying "post":', apiUrl);
          response = await fetch(apiUrl);
          data = await response.json();
          results = data.results || [];
        }

        console.log('RecentPosts: Final raw results:', results);

        if (results.length > 0) {
          const formattedPosts = results.map((item: BuilderContent) => {
            const itemData = item?.data || {};
            
            // Try different ways to get the slug
            const slug = itemData.slug || itemData.url || item.name || '';
            
            return {
              title: itemData.title || item.name || 'Untitled',
              description: itemData.description || itemData.excerpt || itemData.content?.substring(0, 200) || '',
              slug: slug.startsWith('/') ? slug.substring(1) : slug,
              date: itemData.date || item.createdDate,
              image: itemData.image || itemData.featuredImage || itemData.thumbnail,
            };
          }).filter((post: BlogPost) => post.slug);

          console.log('RecentPosts: Formatted posts:', formattedPosts);
          setPosts(formattedPosts);
        } else {
          console.log('RecentPosts: No posts found in any attempted model');
          
          // If no posts are found, we check if we are in the Builder editor
          const isEditing = window.location.search.includes('builder.isEditing=true') || 
                           window.location.hostname.includes('builder.io') ||
                           window.location.hostname.includes('localhost');
          
          if (isEditing) {
            console.log('RecentPosts: Showing dummy data for editor preview');
            setPosts([
              {
                title: 'Post de ejemplo 1',
                description: 'Este es un post de ejemplo que aparece solo en el editor de Builder porque no se encontraron posts reales en el modelo "blog".',
                slug: 'ejemplo-1',
                date: new Date().toISOString(),
              },
              {
                title: 'Post de ejemplo 2',
                description: 'Añade contenido al modelo "blog" en Builder para ver tus posts reales aquí. Asegúrate de que el modelo se llame exactamente "blog".',
                slug: 'ejemplo-2',
                date: new Date().toISOString(),
              }
            ]);
          } else {
            setPosts([]);
          }
        }
      } catch (error) {
        console.error('RecentPosts: Error fetching recent posts:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [count]);

  const truncateText = (text: string, max: number) => {
    if (!text) return '';
    if (text.length <= max) return text;
    return text.substring(0, max).trim() + '...';
  };

  if (loading) {
    return (
      <div 
        className="w-full py-20 flex justify-center items-center"
        style={{ backgroundColor, color: textColor }}
      >
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-white/20 h-10 w-10"></div>
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-white/20 rounded w-48"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-white/20 rounded col-span-2"></div>
                <div className="h-2 bg-white/20 rounded col-span-1"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div 
        className="w-full py-16 text-center opacity-50"
        style={{ backgroundColor, color: textColor }}
      >
        <p>No se encontraron artículos recientes.</p>
      </div>
    );
  }

  return (
    <section 
      className="w-full py-16 md:py-24"
      style={{ backgroundColor, color: textColor }}
      id="recent-posts-section"
    >
      <div className="container mx-auto px-6">
        {/* Section Title */}
        <div className="mb-12 border-b pb-6" style={{ borderColor: lineColor }}>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight uppercase font-heading">
            {title}
          </h2>
        </div>

        {/* Posts List */}
        <div className="space-y-0">
          {posts.map((post, index) => (
            <motion.a
              key={post.slug || index}
              href={`/blog/${post.slug}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group block border-b py-10 md:py-12 transition-all"
              style={{ 
                borderColor: lineColor,
                ...({
                  '--hover-bg': itemHoverBg,
                  '--link-color': linkColor,
                  '--link-hover-color': linkHoverColor
                } as React.CSSProperties)
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = itemHoverBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div className="flex flex-col md:flex-row md:items-start gap-8 md:gap-16">
                {/* Image if enabled */}
                {showImages && post.image && (
                  <div className="w-full md:w-1/4 aspect-video overflow-hidden rounded-lg">
                    <img 
                      src={post.image} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {/* Post Title */}
                <div className={`${showImages ? 'md:w-1/3' : 'md:w-1/2'}`}>
                  {showDates && post.date && (
                    <div 
                      className="text-xs mb-3 font-mono"
                      style={{ color: dateColor }}
                    >
                      {new Date(post.date).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  )}
                  <h3 
                    className="text-xl md:text-2xl font-bold leading-tight uppercase transition-colors duration-300"
                    style={{ color: linkColor }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = linkHoverColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = linkColor;
                    }}
                  >
                    {post.title}
                  </h3>
                </div>

                {/* Post Description */}
                <div className="flex-1">
                  <p 
                    className="text-lg leading-relaxed font-body"
                    style={{ color: descriptionColor }}
                  >
                    {truncateText(post.description, maxDescriptionChars)}
                  </p>
                  
                  <div 
                    className="mt-6 flex items-center text-sm font-bold tracking-widest uppercase transition-all duration-300"
                    style={{ color: readMoreColor }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = readMoreHoverColor;
                      e.currentTarget.style.transform = 'translateX(8px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = readMoreColor;
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    Leer más <ArrowRight className="ml-2 w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentPosts;
