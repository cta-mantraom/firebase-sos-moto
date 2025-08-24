// Types for the Memoryysboy application

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface UserProfile {
  name: string;
  age: number;
  phone: string;
  email: string;
  bloodType: string;
  allergies?: string[];
  medications?: string[];
  medicalConditions?: string[];
  healthPlan?: string;
  preferredHospital?: string;
  medicalNotes?: string;
  emergencyContacts: EmergencyContact[];
  selectedPlan: 'basic' | 'premium';
}

export interface FormData {
  // Identificação
  nomeCompleto: string;
  idade: string;
  telefone: string;
  email: string;

  // Informações Médicas
  tipoSanguineo: string;
  alergias: string;
  medicamentos: string;
  condicoesMedicas: string;
  planoSaude: string;
  hospitalPreferencia: string;
  observacoesMedicas: string;

  // Contatos
  contatoPrimarioNome: string;
  contatoPrimarioTelefone: string;
  contatoPrimarioRelacao: string;
  contatoSecundarioNome: string;
  contatoSecundarioTelefone: string;
  contatoSecundarioRelacao: string;
}

export interface CheckoutData {
  name: string;
  email: string;
  phone: string;
  age: number;
  selectedPlan: 'basic' | 'premium';
  bloodType?: string;
  allergies?: string[];
  medications?: string[];
  medicalConditions?: string[];
  emergencyContacts?: EmergencyContact[];
}

export interface Plan {
  id: 'basic' | 'premium';
  name: string;
  price: string;
  description: string;
  popular?: boolean;
  features: string[];
}

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type Relationship = 
  | 'esposa' 
  | 'marido' 
  | 'mae' 
  | 'pai' 
  | 'filho' 
  | 'irmao' 
  | 'amigo' 
  | 'outro';