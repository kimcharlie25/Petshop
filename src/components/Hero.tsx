import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-br from-forest-50 via-off-white to-mustard-50 py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-merriweather font-bold text-forest-700 mb-6 animate-fade-in">
          Premium Pet Supplies
          <span className="block text-forest-600 mt-2 font-montserrat">Your Pet's Happy Place</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto animate-slide-up">
          Quality products for your beloved companions - because they deserve the best
        </p>
        <div className="flex justify-center">
          <a 
            href="#dim-sum"
            className="bg-forest-600 text-white px-8 py-3 rounded-full hover:bg-forest-700 transition-all duration-300 transform hover:scale-105 font-montserrat font-medium"
          >
            Shop Now
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;