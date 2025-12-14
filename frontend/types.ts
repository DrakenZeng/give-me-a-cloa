export interface Project {
  id: number;
  title: string;
  author: string;
  category: string;
  desc: string;
  likes: number;
  cokes: number;
  tags: string[];
  content: string;
  color: string;
}

export interface NavigationProps {
  onNavigate: (page: 'landing' | 'explore' | 'detail') => void;
}
