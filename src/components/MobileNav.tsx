import React from 'react';
import { useCategories } from '../hooks/useCategories';

interface MobileNavProps {
  activeCategory: string;
  onCategoryClick: (categoryId: string) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeCategory, onCategoryClick }) => {
  const { categories } = useCategories();

  return (
    <div className="sticky top-16 z-40 bg-off-white/95 backdrop-blur-sm border-b border-forest-200 md:hidden shadow-sm">
      <div className="flex overflow-x-auto scrollbar-hide px-4 py-3">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryClick(category.id)}
            className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-full mr-3 transition-all duration-200 font-montserrat ${
              activeCategory === category.id
                ? 'bg-forest-600 text-white'
                : 'bg-mustard-100 text-gray-700 hover:bg-mustard-200'
            }`}
          >
            <span className="text-lg">{category.icon}</span>
            <span className="text-sm font-medium whitespace-nowrap">{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileNav;