import { mount } from 'svelte';
import App from './App.svelte';
import './styles/theme.css';
import './styles/global.css';
import './styles/components.css';
import './styles/utilities.css';

const target = document.getElementById('app');

if (!target) throw new Error('No se encontró el contenedor de la aplicación.');

mount(App, { target });
