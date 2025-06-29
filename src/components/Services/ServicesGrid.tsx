import React from 'react';
import { motion } from 'framer-motion';
import ServiceCard from './ServiceCard';
import { FaFileContract, FaChartLine, FaHandshake } from 'react-icons/fa'; // Example icons

const services = [
  {
    title: 'Credit Report Analysis',
    description: 'Thoroughly review your credit reports from all three bureaus to identify inaccuracies and negative items.',
    icon: <FaFileContract />,
  },
  {
    title: 'Dispute Management',
    description: 'Professionally prepare and submit disputes to credit bureaus and creditors on your behalf.',
    icon: <FaChartLine />,
  },
  {
    title: 'Credit Building Guidance',
    description: 'Provide personalized strategies and advice to help you build and maintain a strong credit profile.',
    icon: <FaHandshake />,
  },
];

const ServicesGrid: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <section id="services" className="bg-background py-20">
      <div className="container mx-auto px-4 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-12 text-4xl font-bold text-foreground"
        >
          Our Comprehensive Services
        </motion.h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {services.map((service, index) => (
            <motion.div key={index} variants={itemVariants}>
              <ServiceCard {...service} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesGrid;