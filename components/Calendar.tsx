import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../constants';

interface CalendarProps {
    onSelectDate: (date: Date) => void;
    minDate?: Date;
    selectedDate?: Date | null;
    className?: string;
}

const Calendar: React.FC<CalendarProps> = ({ onSelectDate, minDate, selectedDate, className }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days = [];
    let date = new Date(startDate);

    while (days.length < 42) {
        days.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    return (
        <div className={`w-80 bg-white rounded-xl shadow-lg border p-4 z-50 ${className}`}>
            <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100">
                    <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                </button>
                <div className="font-semibold text-gray-800">
                    {currentMonth.toLocaleString('en-GB', { month: 'long', year: 'numeric' })}
                </div>
                <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100">
                    <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                    const dayNumber = day.getDate();
                    const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                    
                    const normalizedDay = new Date(day);
                    normalizedDay.setHours(0, 0, 0, 0);

                    const isDisabled = minDate ? normalizedDay < new Date(minDate.setHours(0,0,0,0)) : false;
                    const isSelected = selectedDate ? normalizedDay.getTime() === new Date(selectedDate.setHours(0,0,0,0)).getTime() : false;
                    const isToday = normalizedDay.getTime() === today.getTime();

                    let buttonClass = "w-10 h-10 flex items-center justify-center rounded-full transition-colors text-sm ";
                    
                    if (!isCurrentMonth) {
                        buttonClass += "text-gray-300";
                    } else if (isDisabled) {
                        buttonClass += "text-gray-300 cursor-not-allowed line-through";
                    } else if (isSelected) {
                        buttonClass += "bg-rose-500 text-white font-bold";
                    } else if (isToday) {
                        buttonClass += "bg-rose-100 text-rose-600 font-semibold";
                    } else {
                        buttonClass += "text-gray-700 hover:bg-gray-100";
                    }

                    return (
                        <div key={index} className="flex justify-center items-center">
                            <button
                                onClick={() => !isDisabled && onSelectDate(day)}
                                disabled={isDisabled || !isCurrentMonth}
                                className={buttonClass}
                            >
                                {dayNumber}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Calendar;
