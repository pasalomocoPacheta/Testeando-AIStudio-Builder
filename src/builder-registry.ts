import { Builder } from '@builder.io/react';
import DynamicBackground from './components/DynamicBackground';
import MultiLayerParallax from './components/MultiLayerParallax';
import RevealingParallax from './components/RevealingParallax';
import CookieConsent from './components/CookieConsent';
import RecentPosts from './components/RecentPosts';

Builder.registerComponent(RecentPosts, {
  name: 'Recent Posts Feed',
  description: 'Muestra los últimos posts del blog de forma dinámica',
  inputs: [
    {
      name: 'title',
      type: 'string',
      defaultValue: 'YOU MIGHT ALSO LIKE',
      friendlyName: 'Título de la sección',
    },
    {
      name: 'count',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 10,
      friendlyName: 'Número de posts a mostrar',
    },
    {
      name: 'maxDescriptionChars',
      type: 'number',
      defaultValue: 120,
      min: 50,
      max: 500,
      friendlyName: 'Máximo de caracteres en descripción',
    },
    {
      name: 'backgroundColor',
      type: 'color',
      defaultValue: '#1C0445',
      friendlyName: 'Color de fondo',
    },
    {
      name: 'textColor',
      type: 'color',
      defaultValue: '#FFFFFF',
      friendlyName: 'Color de texto',
    },
    {
      name: 'lineColor',
      type: 'color',
      defaultValue: 'rgba(255, 255, 255, 0.2)',
      friendlyName: 'Color de las líneas divisorias',
    },
    {
      name: 'linkColor',
      type: 'color',
      defaultValue: '#FFFFFF',
      friendlyName: 'Color del título (Enlace)',
    },
    {
      name: 'linkHoverColor',
      type: 'color',
      defaultValue: '#00FF00',
      friendlyName: 'Color del título al pasar el ratón (Hover)',
    },
    {
      name: 'itemHoverBg',
      type: 'color',
      defaultValue: 'rgba(255, 255, 255, 0.05)',
      friendlyName: 'Color de fondo al pasar el ratón (Hover)',
    },
    {
      name: 'readMoreColor',
      type: 'color',
      defaultValue: '#00FF00',
      friendlyName: 'Color de "Leer más"',
    },
    {
      name: 'readMoreHoverColor',
      type: 'color',
      defaultValue: '#FFFFFF',
      friendlyName: 'Color de "Leer más" (Hover)',
    },
    {
      name: 'dateColor',
      type: 'color',
      defaultValue: 'rgba(255, 255, 255, 0.6)',
      friendlyName: 'Color de la fecha',
    },
    {
      name: 'descriptionColor',
      type: 'color',
      defaultValue: 'rgba(255, 255, 255, 0.8)',
      friendlyName: 'Color de la descripción',
    },
    {
      name: 'showImages',
      type: 'boolean',
      defaultValue: false,
      friendlyName: 'Mostrar imágenes de los posts',
    },
    {
      name: 'showDates',
      type: 'boolean',
      defaultValue: true,
      friendlyName: 'Mostrar fechas de los posts',
    },
  ],
});

Builder.registerComponent(CookieConsent, {
  name: 'Cookie Consent Banner',
  description: 'Banner de consentimiento de cookies conforme a RGPD',
});

Builder.registerComponent(RevealingParallax, {
  name: 'Revealing Parallax Section',
  inputs: [
    {
      name: 'image',
      type: 'file',
      allowedFileTypes: ['jpeg', 'jpg', 'png', 'svg', 'webp'],
      defaultValue: 'https://belugalinguistics.com/hubfs/source/assets/images/illustrations/mentoring/mentoring-program-mobile-5.jpg',
    },
    {
      name: 'steps',
      type: 'list',
      defaultValue: [
        { 
          title: 'Mentoring Program', 
          content: '<p>Our mentoring program is designed to help you grow professionally and personally. We provide the tools and guidance you need to succeed.</p>',
          buttonText: 'Learn More',
          buttonLink: '#'
        },
        { 
          title: 'Personalized Guidance', 
          content: '<p>Get one-on-one support from experienced professionals who have been in your shoes. We tailor our approach to your specific goals.</p>' 
        },
        { 
          title: 'Career Growth', 
          content: '<p>Unlock new opportunities and accelerate your career path with our proven strategies and network.</p>' 
        },
      ],
      subFields: [
        { name: 'title', type: 'string', defaultValue: 'Nuevo Paso' },
        { name: 'content', type: 'html', defaultValue: '<p>Contenido del paso...</p>' },
        { name: 'buttonText', type: 'string', friendlyName: 'Texto del botón' },
        { name: 'buttonLink', type: 'string', friendlyName: 'Enlace del botón' },
      ],
    },
    {
      name: 'imagePosition',
      type: 'string',
      enum: ['left', 'right'],
      defaultValue: 'left',
      friendlyName: 'Posición de la imagen (Sticky)',
    },
    {
      name: 'backgroundColor',
      type: 'color',
      defaultValue: '#ffffff',
    },
    {
      name: 'textColor',
      type: 'color',
      defaultValue: '#000000',
    },
    {
      name: 'imageAlt',
      type: 'string',
      defaultValue: 'Ilustración de mentoría',
    },
    {
      name: 'imageRotation',
      type: 'number',
      defaultValue: 0,
      min: -360,
      max: 360,
      step: 1,
      friendlyName: 'Rotación de la imagen (grados)',
    },
    {
      name: 'revealDirection',
      type: 'string',
      enum: ['bottom-to-top', 'top-to-bottom', 'left-to-right', 'right-to-left'],
      defaultValue: 'bottom-to-top',
      friendlyName: 'Dirección de revelado',
    },
  ],
});

Builder.registerComponent(MultiLayerParallax, {
  name: 'Multi-Layer Parallax Scene',
  canHaveChildren: true,
  inputs: [
    {
      name: 'layers',
      type: 'list',
      defaultValue: [
        {
          url: 'https://picsum.photos/seed/layer1/800/600',
          speed: 0.5,
          top: '10%',
          left: '5%',
          width: '30%',
          zIndex: 1,
        },
        {
          url: 'https://picsum.photos/seed/layer2/800/600',
          speed: -0.3,
          bottom: '15%',
          right: '5%',
          width: '25%',
          zIndex: 2,
        },
      ],
      subFields: [
        {
          name: 'url',
          type: 'file',
          allowedFileTypes: ['jpeg', 'jpg', 'png', 'svg', 'webp'],
          required: true,
        },
        {
          name: 'speed',
          type: 'number',
          defaultValue: 0.5,
          min: -2,
          max: 2,
          step: 0.1,
          friendlyName: 'Velocidad (-2 a 2)',
        },
        {
          name: 'top',
          type: 'string',
          defaultValue: '10%',
        },
        {
          name: 'left',
          type: 'string',
          defaultValue: '10%',
        },
        {
          name: 'right',
          type: 'string',
        },
        {
          name: 'bottom',
          type: 'string',
        },
        {
          name: 'width',
          type: 'string',
          defaultValue: '30%',
        },
        {
          name: 'opacity',
          type: 'number',
          defaultValue: 1,
          min: 0,
          max: 1,
          step: 0.1,
        },
        {
          name: 'zIndex',
          type: 'number',
          defaultValue: 1,
        },
      ],
    },
    {
      name: 'height',
      type: 'string',
      defaultValue: '100vh',
      friendlyName: 'Altura de la sección',
    },
    {
      name: 'backgroundColor',
      type: 'color',
      defaultValue: '#f8f9fa',
      friendlyName: 'Color de fondo',
    },
    {
      name: 'showOnMobile',
      type: 'boolean',
      defaultValue: false,
      friendlyName: 'Mostrar efecto en móvil',
    },
  ],
});

Builder.registerComponent(DynamicBackground, {
  name: 'Dynamic Background Section',
  canHaveChildren: true,
  inputs: [
    {
      name: 'color1',
      type: 'color',
      defaultValue: '#4f46e5',
      friendlyName: 'Color 1',
    },
    {
      name: 'color2',
      type: 'color',
      defaultValue: '#ec4899',
      friendlyName: 'Color 2',
    },
    {
      name: 'color3',
      type: 'color',
      defaultValue: '#06b6d4',
      friendlyName: 'Color 3',
    },
    {
      name: 'color4',
      type: 'color',
      defaultValue: '#f59e0b',
      friendlyName: 'Color 4',
    },
    {
      name: 'speed',
      type: 'number',
      defaultValue: 10,
      min: 1,
      max: 50,
      friendlyName: 'Velocidad de animación',
    },
    {
      name: 'opacity',
      type: 'number',
      defaultValue: 0.4,
      min: 0,
      max: 1,
      step: 0.1,
      friendlyName: 'Opacidad del fondo',
    },
    {
      name: 'blur',
      type: 'number',
      defaultValue: 60,
      min: 10,
      max: 200,
      friendlyName: 'Nivel de desenfoque (Blur)',
    },
  ],
});
