import React from "react";
import "./NurseLoadingAnimation.css";
import nurseSceneImg from "./nurse-scene.png";

interface NurseLoadingAnimationProps {
  title?: string;
  subtitle?: string;
  progress?: number;
  duration?: number;
  showStatus?: boolean;
  showProgress?: boolean;
  className?: string;
}

export default function NurseLoadingAnimation({
  title = "Welcome Back",
  subtitle = "Sign in to your Nurse Prep account to continue your journey.",
  progress = 68,
  duration = 6650,
  showStatus = false,
  showProgress = false,
  className = "",
}: NurseLoadingAnimationProps) {
  return (
    <div className={`nurse-loading-container ${className}`}>
      <div className="nurse-artwork-wrapper">
        <div className="nurse-pulse-ring"></div>
        <img
          src={nurseSceneImg}
          alt="Friendly Nurse 3D Artwork"
          className="nurse-artwork"
          referrerPolicy="no-referrer"
        />
      </div>

      <h2 className="nurse-loading-title">{title}</h2>
      <p className="nurse-loading-subtitle">{subtitle}</p>

      {showProgress && (
        <div className="nurse-progress-container">
          <div
            className="nurse-progress-bar"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          ></div>
        </div>
      )}

      {showStatus && showProgress && (
        <div className="nurse-status-text">
          {Math.round(progress)}% Complete
        </div>
      )}
    </div>
  );
}

