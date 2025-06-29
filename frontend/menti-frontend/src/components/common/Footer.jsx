import React from "react";
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Globe,
} from "lucide-react";

const footerLinks = {
  Features: ["Overview", "AI Menti builder", "Live polling"],
  Resources: ["Blog", "How to", "Work"],
  Details: ["Legal", "Policies", "Accessibility"],
  "About us": ["Press info", "The team", "Jobs"],
};

const Footer = () => {
  return (
    <footer className="bg-[#001a4e] text-white py-12 px-4 md:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-12">
        {/* Logo + Social Icons */}
        <div className="space-y-6 col-span-1">
          <div className="text-2xl font-bold">MandiMeter</div>
          <div className="flex gap-3">
            <a href="#">
              <Facebook className="w-5 h-5 hover:text-blue-400" />
            </a>
            <a href="#">
              <Linkedin className="w-5 h-5 hover:text-blue-400" />
            </a>
            <a href="#">
              <Youtube className="w-5 h-5 hover:text-blue-400" />
            </a>
            <a href="#">
              <Instagram className="w-5 h-5 hover:text-blue-400" />
            </a>
            <a href="#">
              <Twitter className="w-5 h-5 hover:text-blue-400" />
            </a>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300 mt-4">
            <Globe className="w-4 h-4" />
            <span>Choose your language</span>
          </div>
        </div>

        {/* Link Columns */}
        {Object.entries(footerLinks).map(([heading, links]) => (
          <div key={heading}>
            <h4 className="font-semibold text-white underline underline-offset-4 mb-4">
              {heading}
            </h4>
            <ul className="space-y-2 text-sm text-gray-300">
              {links.map((link, idx) => (
                <li key={idx} className="hover:text-white cursor-pointer">
                  {link}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom copyright bar */}
      <div className="border-t border-gray-700 mt-12 pt-4 text-sm text-gray-400 text-center">
        &copy; {new Date().getFullYear()} MandiMeter. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
