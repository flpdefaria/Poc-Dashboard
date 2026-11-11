export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface CarDto {
  id: number;
  model: string;
  vin: string;
  description: string;
  bodyType: string;
  price: number;
  stock: number;
  mileage: number;
  isAvailable: boolean;
  modelYear: number;
  brandId: number;
  brandName: string;
}

export interface BrandCarSummary {
  model: string;
  modelYear: number;
}

export interface BrandDto {
  id: number;
  name: string;
  description: string;
  country: string;
  foundedDate: string;
  yearsInBusiness: number;
  carsCount: number;
  cars: BrandCarSummary[];
}

/** `GET /api/cars/options` entry: `name` = "Brand Model" (same label as `CustomerDto.carName`). */
export interface CarOption {
  id: number;
  name: string;
}

export interface BrandOption {
  id: number;
  name: string;
}

export interface CustomerDto {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  createdAt: string;
  /** Linked car (`Customer.CarId`), or null. */
  carId: number | null;
  /** Brand + model of the linked car, e.g. "Toyota Corolla"; null without a car. */
  carName: string | null;
}
