import React from 'react';
import { motion } from 'framer-motion';

const TestimonialsPage: React.FC = () => {
  const fadeInAnimation = {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: 0.8, ease: 'easeOut' },
  };

  return (
    <section id="testimonials" className="bg-accent py-20 min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-4 text-center">
        <motion.h2
          {...fadeInAnimation}
          className="mb-12 text-4xl font-bold text-foreground"
        >
          What Our Clients Say
        </motion.h2>
        <motion.div
          {...fadeInAnimation}
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {/* Placeholder for Testimonial Cards */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <p className="text-muted-foreground italic mb-4">"CreditClarity transformed my financial life! Their team was professional, efficient, and helped me achieve a credit score I never thought possible."</p>
            <p className="font-semibold text-foreground">- Jane D.</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <p className="text-muted-foreground italic mb-4">"I was skeptical at first, but CreditClarity delivered. My credit score improved significantly, opening doors to better loan rates."</p>
            <p className="font-semibold text-foreground">- Robert S.</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <p className="text-muted-foreground italic mb-4">"The process was clear and straightforward. CreditClarity made credit repair easy and stress-free. Highly recommend!"</p>
            <p className="font-semibold text-foreground">- Emily R.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsPage;
