type MarkerData = {
  empId: number;
  empCode: string;
  empName: string;
  dateD: string;
  latitude: number;
  longitude: number;
};

let allMarkersCache: MarkerData[] = [];

export const setAllLocationMarkers = (markers: MarkerData[]) => {
  allMarkersCache = Array.isArray(markers) ? markers : [];
};

export const getAllLocationMarkers = () => allMarkersCache;

