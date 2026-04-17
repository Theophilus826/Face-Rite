import React from "react";

export default function RobotLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      
      {/* Robot Logo */}
      <div className="relative">
        <img
          src="/logos.jpg" // replace with your robot logo path
          alt="Face Rite"
          className="w-24 h-24 animate-bounce"
        />

        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 blur-xl animate-pulse"></div>
      </div>

      {/* Loading text */}
      <p className="mt-6 text-lg font-semibold text-gray-700">
        Loading Face Rite...
      </p>

      {/* Dots animation */}
      <div className="flex space-x-1 mt-2">
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"></span>
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-300"></span>
      </div>
    </div>
  );
}
export function GameLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white">
      
      <img
        src="/logos.jpg"
        alt="Face Rite"
        className="w-28 h-28 animate-spin-slow"
      />

      <p className="mt-6 text-xl font-bold tracking-wide">
        Initializing Game...
      </p>

      {/* Progress bar */}
      <div className="w-48 h-2 bg-gray-700 rounded mt-4 overflow-hidden">
        <div className="h-full bg-blue-400 animate-loading-bar"></div>
      </div>
    </div>
  );
}