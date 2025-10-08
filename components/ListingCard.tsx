import React, { useState, useMemo, useEffect } from 'react';
import { Listing } from '../types';
import { AmenityIcons, ChevronLeftIcon, ChevronRightIcon, StarIcon } from '../constants';

interface ListingCardProps {
  listing: Listing;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const images = useMemo(() => {
    const seed = listing.name.replace(/\s/g, '');
    return [
        `https://picsum.photos/seed/${seed}/400/300`,
        `https://picsum.photos/seed/${seed}2/400/300`,
        `https://picsum.photos/seed/${seed}3/400/300`,
        `https://picsum.photos/seed/${seed}4/400/300`
    ];
  }, [listing.name]);

  useEffect(() => {
    if (isHovering) return; // Pause carousel on hover

    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(timer); // Cleanup on component unmount
  }, [isHovering, images.length]);


  const handlePrev = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentImageIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  };


  return (
    <div 
      className="bg-white/60 backdrop-blur-md border border-white/30 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative group/carousel">
        <img className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105" src={images[currentImageIndex]} alt={listing.name} />

        {/* Carousel controls */}
        <button onClick={handlePrev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 hover:bg-white z-20">
            <ChevronLeftIcon className="w-5 h-5 text-gray-800" />
        </button>
        <button onClick={handleNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 hover:bg-white z-20">
            <ChevronRightIcon className="w-5 h-5 text-gray-800" />
        </button>

        {/* Image dots */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, index) => (
                <div key={index} className={`w-2 h-2 rounded-full transition-all duration-300 ${currentImageIndex === index ? 'bg-white scale-110' : 'bg-white/50'}`}></div>
            ))}
        </div>


        {listing.isAiSuggested && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center shadow-lg z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 9a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM9 2a1 1 0 011 1v1h1a1 1 0 110 2H10v1a1 1 0 11-2 0V6H7a1 1 0 110-2h1V3a1 1 0 011-1zm5 4a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1V7a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            AI Top Pick
          </div>
        )}
         {listing.specialOffer && (
            <div className="absolute top-3 right-3 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10">
                {listing.specialOffer}
            </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg text-gray-800 leading-tight group-hover:text-rose-500 transition-colors">{listing.name}</h3>
            <div className="flex items-center gap-1 text-gray-700 ml-2 shrink-0">
                <StarIcon className="h-4 w-4 text-yellow-400"/>
                <span className="font-semibold text-sm">{listing.rating.toFixed(1)}</span>
            </div>
        </div>
        <p className="text-sm text-gray-500 truncate">{listing.tagline}</p>
        <p className="text-xs text-gray-400 mt-1">({listing.reviewCount} reviews)</p>

        <p className="text-sm text-gray-600 mt-2 flex-grow italic">"{listing.guestHighlight}"</p>

        <div className="mt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">Location</p>
            <p className="text-sm text-gray-700">{listing.location}</p>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100/80 flex justify-between items-center">
            <div className="flex items-center gap-3 text-gray-500">
                {listing.amenities.slice(0, 4).map(amenity => (
                    <div key={amenity} className="relative group/tooltip">
                      {AmenityIcons[amenity]}
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs font-semibold rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                          {amenity}
                      </div>
                    </div>
                ))}
            </div>
            <div className="text-right">
                <p className="text-lg font-bold text-gray-900">£{listing.pricePerNight}</p>
                <p className="text-xs text-gray-500">/ night</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;