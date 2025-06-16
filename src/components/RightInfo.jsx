import React from 'react';
import '../styles/main.css';

const RightInfo = ({ activeView }) => {
  // Content based on the active view
  const viewContent = {
    aerienne: {
      title: "La Promesse d'un héritage",
      content: `Les Villas d'Anfa Marrakech s'étendent sur 14,5 hectares et offrent un cadre fermé et sécurisé, combinant luxe et tranquillité. Le projet propose 91 villas, réparties entre des villas jumelées et quelques villas isolées, chacune offrant un confort optimal dans un cadre privilégié. Ces villas sont conçues pour répondre aux attentes les plus exigeantes, avec des espaces généreux et un aménagement intérieur soigné. En complément, des lots de terrains de 500 à 876 m² sont également disponibles, offrant ainsi la possibilité de construire selon vos préférences.`
    },
    villas: {
      title: "Des villas d'exception",
      content: "Découvrez nos villas d'exception alliant architecture contemporaine et tradition marocaine. Plusieurs typologies sont disponibles, des villas jumelées aux villas isolées, toutes conçues pour offrir un cadre de vie privilégié où luxe et confort se conjuguent harmonieusement."
    },
    parcelles: {
      title: "Terrains à bâtir",
      content: "Des parcelles de terrain viabilisées de 500 à 876 m² vous sont proposées pour réaliser votre projet immobilier sur mesure. Profitez de l'environnement exclusif des Villas d'Anfa tout en concevant votre résidence selon vos envies et besoins spécifiques."
    }
  };

  return (
    <div className="right-info">
      <h2 className="info-title">{viewContent[activeView].title}</h2>
      <p className="info-content">{viewContent[activeView].content}</p>
    </div>
  );
};

export default RightInfo;