import React from "react";

const Footer = () => {
  return (
    <section className="relative bottom-0">
      <footer className="bg-gray-800 text-white py-1">
        <div className="container mx-auto text-center">
          <div className="flex flex-row justify-between items-center px-5">
            <span>
              &copy; {new Date().getFullYear()} Menti. All rights reserved.
            </span>
            <div>
              <a
                href="/privacy-policy"
                className="text-blue-400 hover:underline"
              >
                Privacy Policy
              </a>{" "}
              |
              <a
                href="/terms-of-service"
                className="text-blue-400 hover:underline"
              >
                {" "}
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </section>
  );
};

export default Footer;
