import React from 'react';
import { Bus } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex">
      {/* Left Side - Graphic/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="relative z-10 text-center text-white px-12">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl animate-float">
            <Bus className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-extrabold mb-6 tracking-tight">UniTrack</h1>
          <p className="text-xl text-blue-100 font-medium max-w-md mx-auto leading-relaxed">
            The next generation of campus transit. Real-time tracking, seamless commutes, and complete peace of mind.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:w-1/2 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center space-x-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">UniTrack</h1>
          </div>

          <div className="text-center lg:text-left mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{title}</h2>
            {subtitle && <p className="mt-2 text-sm text-gray-500">{subtitle}</p>}
          </div>

          <div className="bg-white py-10 px-6 sm:rounded-3xl sm:px-10 shadow-2xl shadow-indigo-100/50 border border-gray-100">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
