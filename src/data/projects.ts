import type { BentoItemProps } from '../components/sections/BentoCard';

export const projects: BentoItemProps[] = [
  {
    category: 'CV // IJCAI Proposal',
    description:
      'Dense 3D mesh reconstruction from 2D silhouette masks without storing raw RGB image data.',
    id: 'privacy-preserving-body-composition',
    imageSrc: '/assets/project_body_composition.png',
    magneticText: 'VIEW MESH',
    size: 'wide',
    tags: ['PyTorch', 'OpenCV', '3D Mesh', 'Privacy'],
    title: 'Privacy-Preserving Body Composition',
  },
  {
    category: 'NLP // Intelligence',
    description:
      'A real-time vectorizer clustering more than 10,000 unstructured customer-feedback entries into actionable sentiment vectors.',
    id: 'nlp-sentiment-topic-engine',
    imageSrc: '/assets/project_nlp_engine.png',
    magneticText: 'EXPLORE',
    size: 'small',
    tags: ['BERT', 'Transformers', 'K-Means', 'FastAPI'],
    title: 'NLP Sentiment & Topic Engine',
  },
  {
    category: 'Data Science // 1M+ Records',
    description:
      'Predictive modeling over one million Chicago traffic collision reports with spatial feature extraction.',
    id: 'accident-severity-classifier',
    imageSrc: '/assets/project_accident_severity.png',
    magneticText: 'INSPECT',
    size: 'full',
    tags: ['XGBoost', 'Pandas', 'Geo Features', 'Scikit-learn'],
    title: 'Accident Severity ML Classifier',
  },
  {
    category: 'Robotics // Hardware',
    description:
      'An unmanned surface vessel for autonomous ocean-debris intake and environmental sensing.',
    id: 'autonomous-water-collection-usv',
    imageSrc: '/assets/project_usv_robotics.png',
    magneticText: 'VIEW USV',
    size: 'small',
    tags: ['C++', 'GPS Telemetry', 'Control Systems', 'Robotics'],
    title: 'Autonomous Water Collection USV',
  },
];
