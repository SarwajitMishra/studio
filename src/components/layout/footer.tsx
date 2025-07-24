
import Link from 'next/link';
import { Separator } from '../ui/separator';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 py-8 mt-16">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <h3 className="font-bold text-white mb-2">Firebase Studio</h3>
            <p className="text-sm">A project by the Shravya Foundation, dedicated to making learning accessible and fun.</p>
            <div className="mt-4">
                <a href="mailto:hello@shravya.foundation" className="text-sm hover:text-white">hello@shravya.foundation</a>
            </div>
          </div>
          <div>
              <h3 className="font-bold text-white mb-2">Quick Links</h3>
              <ul className="space-y-1 text-sm">
                  <li><Link href="/info" className="hover:text-white">About Us</Link></li>
                  <li><Link href="/privacy-policy" className="hover:text-white">Privacy & Child Safety</Link></li>
                  <li><Link href="/contact-us" className="hover:text-white">Contact</Link></li>
              </ul>
          </div>
           <div>
              <h3 className="font-bold text-white mb-2">Legal</h3>
              <ul className="space-y-1 text-sm">
                  <li><Link href="/terms-and-conditions" className="hover:text-white">Terms of Service</Link></li>
                  <li><Link href="/cookies-policy" className="hover:text-white">Cookies Policy</Link></li>
                  <li><Link href="/community-guidelines" className="hover:text-white">Community Guidelines</Link></li>
              </ul>
          </div>
        </div>
         <Separator className="my-6 bg-gray-700" />
         <p className="text-center text-xs">&copy; {new Date().getFullYear()} Shravya Foundation. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
