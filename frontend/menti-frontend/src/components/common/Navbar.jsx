import { section } from "framer-motion/client";
import React from "react";

const Navbar = () => {
  return (
    <section>
      <nav>
        <div className="flex justify-between items-center p-4 bg-gray-800 text-white">
          <div className="text-lg font-bold">Menti</div>
          <ul className="flex space-x-4">
            <li>
              <a href="/" className="">
                Home
              </a>
            </li>
            <li>
              <a href="/dashboard" className="">
                Dashboard
              </a>
            </li>
            <li>
              <a href="/about" className="">
                About
              </a>
            </li>
            <li>
              <a href="/contact" className="">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </section>
  );
};

export default Navbar;
