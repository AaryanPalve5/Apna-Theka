import { useState, useEffect } from 'react';

function App() {
  const [activeCategory, setActiveCategory] = useState('Beer');
  const [activeSubCategory, setActiveSubCategory] = useState('All'); // New state for sub-filters
  const [products, setProducts] = useState([]);

  // Main Categories
  const categories = ['Beer', 'Whisky', 'Vodka', 'Rum'];

  // Sub-categories specifically for Whisky
  const whiskySubCategories = ['All', 'Single Malts', 'World Whisky', 'Made in India Whisky', 'Blended Scotch'];

  // Fetch logic
  useEffect(() => {
    let url = '';
    // Reset sub-category to 'All' whenever main category changes
    setActiveSubCategory('All'); 

    if (activeCategory === 'Beer') url = 'http://localhost:8080/api/beers';
    else if (activeCategory === 'Vodka') url = 'http://localhost:8080/api/vodka';
    else if (activeCategory === 'Rum') url = 'http://localhost:8080/api/rum';
    else if (activeCategory === 'Whisky') url = 'http://localhost:8080/api/whisky';

    if (url) {
      fetch(url)
        .then(response => response.json())
        .then(data => setProducts(data))
        .catch(error => console.error('Error:', error));
    }
  }, [activeCategory]);

  // Filter logic: If we are in Whisky, filter by the active sub-category
  const displayedProducts = activeCategory === 'Whisky' && activeSubCategory !== 'All'
    ? products.filter(item => item.category === activeSubCategory)
    : products;

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-pink-500 selection:text-white">
      
      {/* --- HERO SECTION --- */}
      <div className="relative bg-slate-900 py-12 text-center">
        <h1 className="text-4xl font-black text-white sm:text-6xl mb-4">
          Pune Alcohol <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-600">Tracker</span>
        </h1>
        <p className="text-gray-400">Real-time prices for students in Pune.</p>
      </div>

      {/* --- MAIN TABS (Sticky) --- */}
      <div className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-white/10 py-4">
        <div className="flex flex-wrap justify-center gap-3 px-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                px-6 py-2 rounded-full font-bold text-sm transition-all transform hover:scale-105
                ${activeCategory === cat 
                  ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/30' 
                  : 'bg-slate-800 text-gray-400 border border-slate-700 hover:text-white'}
              `}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* --- SUB-CATEGORY TABS (Only visible for Whisky) --- */}
        {activeCategory === 'Whisky' && (
          <div className="flex flex-wrap justify-center gap-2 mt-4 animate-fade-in-down px-4">
            {whiskySubCategories.map((sub) => (
              <button
                key={sub}
                onClick={() => setActiveSubCategory(sub)}
                className={`
                  px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors
                  ${activeSubCategory === sub
                    ? 'bg-violet-600 border-violet-500 text-white'
                    : 'bg-transparent border-slate-600 text-slate-400 hover:border-slate-400'}
                `}
              >
                {sub}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* --- GRID --- */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {displayedProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {displayedProducts.map((item, index) => (
              <div 
                key={item.id || index} // Fallback to index if IDs duplicate across categories
                className="group bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-pink-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="h-48 bg-white p-4 flex items-center justify-center relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500"
                  />
                  {/* Category Badge (Shows sub-category for Whisky) */}
                  <span className="absolute bottom-2 left-2 bg-black/70 text-[10px] font-bold px-2 py-0.5 rounded text-white uppercase tracking-wider">
                    {item.category}
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-200 line-clamp-2 h-10 mb-2">{item.name}</h3>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                    <p className="text-xs text-gray-500">{item.volume}</p>
                    <p className="text-lg font-bold text-white">₹{item.price}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-white mb-2">No Data Found</h2>
            <p className="text-gray-400">Try selecting a different category.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;