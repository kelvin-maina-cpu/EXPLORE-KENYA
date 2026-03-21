import { StatusBar } from 'expo-status-bar';
import LandingShowcase from '../components/LandingShowcase';

export default function WelcomeScreen() {
  return (
    <>
      <StatusBar style="light" />
      <LandingShowcase />
    </>
  );
}
