import { createBrowserRouter } from 'react-router';
import { MapPage } from '@/pages/MapPage';
import { SearchPage } from '@/pages/SearchPage';

export const router = createBrowserRouter([
  { path: '/', element: <MapPage /> },
  { path: '/search', element: <SearchPage /> },
]);
