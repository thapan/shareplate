import React from 'react';
import { ModernLogo, ModernLogoMark } from './ModernLogo';

export default function LogoShowcase() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">SharePlate Logo Showcase</h1>
          <p className="text-slate-600">Principal Artist-Level Design</p>
        </div>

        {/* Large Logo Display */}
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-slate-100">
          <h2 className="text-xl font-semibold text-slate-900 mb-8">Full Logo - Large</h2>
          <div className="flex justify-center mb-8">
            <ModernLogo size="large" showBeta={true} />
          </div>
          <div className="flex justify-center">
            <ModernLogo size="large" showBeta={false} />
          </div>
        </div>

        {/* Logo Mark Only */}
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-slate-100">
          <h2 className="text-xl font-semibold text-slate-900 mb-8">Logo Mark Only</h2>
          <div className="flex justify-center items-center gap-8">
            <div className="text-center">
              <ModernLogoMark size={120} />
              <p className="text-sm text-slate-500 mt-4">120px</p>
            </div>
            <div className="text-center">
              <ModernLogoMark size={80} />
              <p className="text-sm text-slate-500 mt-4">80px</p>
            </div>
            <div className="text-center">
              <ModernLogoMark size={48} />
              <p className="text-sm text-slate-500 mt-4">48px</p>
            </div>
          </div>
        </div>

        {/* Different Backgrounds */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 rounded-2xl shadow-xl p-8 text-center">
            <h3 className="text-lg font-semibold text-white mb-6">Dark Background</h3>
            <ModernLogo size="default" showBeta={true} />
          </div>
          <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl shadow-xl p-8 text-center">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Colored Background</h3>
            <ModernLogo size="default" showBeta={true} />
          </div>
        </div>

        {/* Size Variations */}
        <div className="bg-white rounded-2xl shadow-xl p-12 border border-slate-100">
          <h2 className="text-xl font-semibold text-slate-900 mb-8 text-center">Size Variations</h2>
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 w-20">Large:</span>
              <ModernLogo size="large" showBeta={true} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 w-20">Default:</span>
              <ModernLogo size="default" showBeta={true} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 w-20">Small:</span>
              <ModernLogo size="small" showBeta={true} />
            </div>
          </div>
        </div>

        {/* Design Details */}
        <div className="bg-white rounded-2xl shadow-xl p-12 border border-slate-100">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Design Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Visual Elements</h3>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>• Multi-stop gradient backgrounds</li>
                <li>• Radial gradients for depth</li>
                <li>• SVG glow effects and filters</li>
                <li>• Artistic highlight strokes</li>
                <li>• Heart symbol for sharing love</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Typography</h3>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>• Font-black weight for impact</li>
                <li>• Gradient text effects</li>
                <li>• Refined letter spacing</li>
                <li>• Premium BETA badge styling</li>
                <li>• Consistent scaling system</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}