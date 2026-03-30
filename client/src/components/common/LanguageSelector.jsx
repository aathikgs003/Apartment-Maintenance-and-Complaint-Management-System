import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

const languages = [
    { code: 'en', name: 'English' },
    { code: 'ta', name: 'தமிழ்' },
];

const LanguageSelector = () => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLanguageChange = (code) => {
        i18n.changeLanguage(code);
        setIsOpen(false);
    };

    const currentLang = languages.find((lang) => lang.code === i18n.language) || languages[0];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 text-slate-500 hover:text-slate-700 focus:outline-none transition-colors px-3 py-2 rounded-lg hover:bg-slate-50"
                aria-label="Select Language"
            >
                <GlobeAltIcon className="h-5 w-5" />
                <span className="text-sm font-medium hidden sm:block">{currentLang.name}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl py-2 ring-1 ring-black ring-opacity-5 border border-slate-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang.code)}
                            className={`flex items-center w-full px-4 py-2.5 text-sm font-medium transition-colors mx-1 rounded-lg
                ${i18n.language === lang.code
                                    ? 'bg-sky-50 text-sky-600'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <span className="flex-1 text-left">{lang.name}</span>
                            {i18n.language === lang.code && (
                                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 ml-2"></span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;
