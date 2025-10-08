import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SearchIcon } from '../constants';
import Calendar from './Calendar';

interface SearchBarProps {
    destination: string;
    setDestination: (dest: string) => void;
    checkIn: Date | null;
    setCheckIn: (date: Date | null) => void;
    checkOut: Date | null;
    setCheckOut: (date: Date | null) => void;
    handleSearch: () => void;
    isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ destination, setDestination, checkIn, setCheckIn, checkOut, setCheckOut, handleSearch, isLoading }) => {
    const [guests, setGuests] = useState('');
    const [activePicker, setActivePicker] = useState<'checkIn' | 'checkOut' | null>(null);
    const searchBarRef = useRef<HTMLDivElement>(null);

    const [placeholder, setPlaceholder] = useState('Search destinations');
    const exampleDestinations = useMemo(() => ['London', 'Berlin', 'Stockholm', 'Paris', 'New York', 'Tokyo'], []);
    
    useEffect(() => {
        let index = 0;
        const intervalId = setInterval(() => {
            index = (index + 1) % exampleDestinations.length;
            setPlaceholder(`${exampleDestinations[index]}`);
        }, 2000);
        return () => clearInterval(intervalId);
    }, [exampleDestinations]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
                setActivePicker(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelectCheckIn = (date: Date) => {
        setCheckIn(date);
        if (checkOut && date >= checkOut) {
            setCheckOut(null);
        }
        setActivePicker('checkOut');
    };

    const handleSelectCheckOut = (date: Date) => {
        setCheckOut(date);
        setActivePicker(null);
    };

    const formatDate = (date: Date | null) => {
        if (!date) return '';
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    };

    const handleEnterPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (destination.trim()) {
                setActivePicker('checkIn');
            }
        }
    };
    
    const checkOutMinDate = useMemo(() => {
        if (!checkIn) return new Date();
        const nextDay = new Date(checkIn);
        nextDay.setDate(nextDay.getDate() + 1);
        return nextDay;
    }, [checkIn]);

    return (
        <div ref={searchBarRef} className="relative bg-white rounded-full shadow-lg border border-gray-200 flex items-center p-2 w-full max-w-3xl mx-auto my-6">
            <div className="flex-grow px-4 py-1 hover:bg-gray-100 rounded-full cursor-pointer">
                <label className="block text-xs font-bold text-gray-800">Where</label>
                <input 
                    type="text" 
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    onKeyDown={handleEnterPress}
                    placeholder={placeholder}
                    className="w-full bg-transparent focus:outline-none text-gray-600 placeholder-gray-400"
                    aria-label="Search destinations"
                />
            </div>
            <div className="border-l border-gray-200 h-10 mx-2"></div>
            <div className="flex-grow px-4 py-1 hover:bg-gray-100 rounded-full cursor-pointer hidden sm:block">
                <label className="block text-xs font-bold text-gray-800">Check in</label>
                <input 
                    type="text" 
                    value={formatDate(checkIn)}
                    onClick={() => setActivePicker('checkIn')}
                    readOnly
                    placeholder="Add dates"
                    className="w-full bg-transparent focus:outline-none text-gray-600 placeholder-gray-400 cursor-pointer"
                    aria-label="Check in date"
                />
            </div>
            <div className="border-l border-gray-200 h-10 mx-2 hidden sm:block"></div>
            <div className="flex-grow px-4 py-1 hover:bg-gray-100 rounded-full cursor-pointer hidden sm:block">
                <label className="block text-xs font-bold text-gray-800">Check out</label>
                <input 
                    type="text" 
                    value={formatDate(checkOut)}
                    onClick={() => setActivePicker('checkOut')}
                    readOnly
                    placeholder="Add dates"
                    className="w-full bg-transparent focus:outline-none text-gray-600 placeholder-gray-400 cursor-pointer"
                    aria-label="Check out date"
                />
            </div>
            <div className="border-l border-gray-200 h-10 mx-2 hidden lg:block"></div>
            <div className="flex-grow px-4 py-1 pr-2 hover:bg-gray-100 rounded-full cursor-pointer hidden lg:flex items-center justify-between">
                <div>
                    <label className="block text-xs font-bold text-gray-800">Who</label>
                    <input 
                        type="text" 
                        value={guests}
                        onChange={(e) => setGuests(e.target.value)}
                        placeholder="Add guests"
                        className="w-full bg-transparent focus:outline-none text-gray-600 placeholder-gray-400"
                        aria-label="Number of guests"
                    />
                </div>
                <button
                    onClick={handleSearch}
                    disabled={isLoading || !destination.trim()}
                    className="w-12 h-12 flex-shrink-0 bg-rose-500 text-white font-semibold rounded-full hover:bg-rose-600 transition-all duration-300 disabled:bg-rose-300 disabled:cursor-not-allowed flex items-center justify-center ml-4"
                    aria-label="Search"
                >
                     {isLoading ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" role="status"></div>
                     ) : (
                        <SearchIcon className="w-6 h-6 text-white" />
                     )}
                </button>
            </div>
             <button
                onClick={handleSearch}
                disabled={isLoading || !destination.trim()}
                className="w-12 h-12 flex-shrink-0 bg-rose-500 text-white font-semibold rounded-full hover:bg-rose-600 transition-all duration-300 disabled:bg-rose-300 disabled:cursor-not-allowed flex items-center justify-center lg:hidden"
                aria-label="Search"
            >
                 {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" role="status"></div>
                 ) : (
                    <SearchIcon className="w-6 h-6 text-white" />
                 )}
            </button>

            {activePicker === 'checkIn' && (
                <Calendar 
                    onSelectDate={handleSelectCheckIn}
                    minDate={new Date()}
                    selectedDate={checkIn}
                    className="absolute top-[120%] left-1/4"
                />
            )}
            {activePicker === 'checkOut' && (
                <Calendar 
                    onSelectDate={handleSelectCheckOut}
                    minDate={checkOutMinDate}
                    selectedDate={checkOut}
                    className="absolute top-[120%] left-1/2"
                />
            )}
        </div>
    );
};

export default SearchBar;