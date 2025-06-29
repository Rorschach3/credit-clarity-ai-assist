import React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '../layout/Navbar';

const Hero: React.FC = () => {
  return (
    <>
      <Navbar />
      <section id="home" className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-background to-accent-foreground py-20 text-center">
        <div className="container z-10 px-4">
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mb-4 text-5xl font-bold leading-tight text-foreground md:text-6xl text-slate-800"
          >
            Financial Assistance Services You Can Trust
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="mb-8 text-xl text-muted-foreground md:text-2xl"
          >
            Raise your credit score. Reclaim your financial freedom.
          </motion.p>
        </div>
      </section>
    </>
  );
};

export default Hero;