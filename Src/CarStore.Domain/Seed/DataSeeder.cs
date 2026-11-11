using CarStore.Domain.Data;
using CarStore.Domain.Entities;

namespace CarStore.Domain.Seed;

public static class DataSeeder
{
    public static void Seed(CarStoreContext db)
    {
        SeedBrands(db);
        SeedCars(db);
        SeedCustomers(db);
        db.SaveChanges();
    }

    private static void SeedBrands(CarStoreContext db)
    {
        if (db.Brands.Any())
            return;

        var brands = new List<Brand>
        {
            new() { Id = 1,  Name = "Toyota",     Country = "Japan",   FoundedDate = new DateTime(1937, 8, 28), Description = "Japanese multinational known for reliability and hybrid technology." },
            new() { Id = 2,  Name = "Ford",       Country = "USA",     FoundedDate = new DateTime(1903, 6, 16), Description = "American automaker famous for the Mustang and F-Series trucks." },
            new() { Id = 3,  Name = "BMW",        Country = "Germany", FoundedDate = new DateTime(1916, 3, 7),  Description = "German manufacturer of luxury vehicles and motorcycles." },
            new() { Id = 4,  Name = "Honda",      Country = "Japan",   FoundedDate = new DateTime(1948, 9, 24), Description = "Japanese engineering company known for efficient, dependable cars." },
            new() { Id = 5,  Name = "Chevrolet",  Country = "USA",     FoundedDate = new DateTime(1911, 11, 3), Description = "American brand known for muscle cars and full-size trucks." },
            new() { Id = 6,  Name = "Volkswagen", Country = "Germany", FoundedDate = new DateTime(1937, 5, 28), Description = "German automaker and one of the world's largest carmakers." },
            new() { Id = 7,  Name = "Tesla",      Country = "USA",     FoundedDate = new DateTime(2003, 7, 1),  Description = "American company pioneering mass-market electric vehicles." },
            new() { Id = 8,  Name = "Audi",       Country = "Germany", FoundedDate = new DateTime(1909, 7, 16), Description = "German luxury brand known for quattro all-wheel drive." },
            new() { Id = 9,  Name = "Hyundai",    Country = "South Korea", FoundedDate = new DateTime(1967, 12, 29), Description = "South Korean automaker known for value and warranty coverage." },
            new() { Id = 10, Name = "Mazda",      Country = "Japan",   FoundedDate = new DateTime(1920, 1, 30), Description = "Japanese automaker known for driver-focused engineering." }
        };

        db.Brands.AddRange(brands);
    }

    private static void SeedCars(CarStoreContext db)
    {
        if (db.Cars.Any())
            return;

        static Car MakeCar(int id, int brandId, string model, string vin, string bodyType, decimal price, int stock, int modelYear, string description, int mileage)
        {
            var c = Car.Create(model, vin, description, bodyType, price, stock, modelYear, brandId, mileage);
            c.Id = id;
            return c;
        }

        var cars = new List<Car>
        {
            MakeCar(1,  1,  "Corolla",       "JT2BF22K1W0123456", "Sedan",       22499.00m, 25, 2024, "Compact sedan known for reliability and fuel economy.", 12),
            MakeCar(2,  1,  "Camry",         "4T1BF1FK5CU123457", "Sedan",       27500.00m, 40, 2024, "Midsize sedan with hybrid options.",                     8),
            MakeCar(3,  1,  "RAV4",          "JTMBFREV0ND123458", "SUV",         29500.00m,  8, 2025, "Compact crossover SUV.",                                 0),
            MakeCar(4,  2,  "Mustang",       "1FA6P8CF5J5123459", "Coupe",       38500.00m, 30, 2024, "Iconic American muscle car.",                            5),
            MakeCar(5,  2,  "F-150",         "1FTFW1E58MFA23460", "Truck",       45000.00m, 18, 2024, "Best-selling full-size pickup truck.",                  15),
            MakeCar(6,  2,  "Explorer",      "1FM5K8D84LGA23461", "SUV",         39900.00m,  0, 2025, "Three-row family SUV.",                                  0),
            MakeCar(7,  3,  "3 Series",      "WBA5R1C0XLA123462", "Sedan",       44500.00m, 50, 2024, "Compact executive sedan.",                              10),
            MakeCar(8,  3,  "X5",            "5UXCR6C0XL9123463", "SUV",        65900.00m, 22, 2024, "Midsize luxury SUV.",                                    3),
            MakeCar(9,  3,  "M4",            "WBS43AZ00LC123464", "Coupe",      78500.00m, 17, 2025, "High-performance coupe.",                                 1),
            MakeCar(10, 4,  "Civic",         "2HGFC2F59NH123465", "Sedan",       24500.00m, 12, 2024, "Compact car popular with first-time buyers.",           20),
            MakeCar(11, 4,  "Accord",        "1HGCV1F34NA123466", "Sedan",       28500.00m, 14, 2024, "Midsize sedan with spacious interior.",                  9),
            MakeCar(12, 4,  "CR-V",          "7FARW2H59NE123467", "SUV",        30500.00m,  9, 2025, "Compact crossover SUV.",                                  0),
            MakeCar(13, 5,  "Silverado",     "3GCUYDED5NG123468", "Truck",       42500.00m, 20, 2024, "Full-size pickup truck.",                                11),
            MakeCar(14, 5,  "Camaro",        "1G1FB1RS8N0123469", "Coupe",       36500.00m, 11, 2024, "American sports car.",                                    4),
            MakeCar(15, 6,  "Golf",          "WVWZZZ1KZNW123470", "Hatchback",  25500.00m, 16, 2024, "Compact hatchback with German engineering.",             7),
            MakeCar(16, 6,  "Tiguan",        "WVGZZZ5NZNW123471", "SUV",        29900.00m,  7, 2024, "Compact SUV with all-wheel drive option.",               13),
            MakeCar(17, 7,  "Model 3",       "5YJ3E1EA9NF123472", "Sedan",       41000.00m, 13, 2024, "Mass-market all-electric sedan.",                        0),
            MakeCar(18, 7,  "Model Y",       "7SAYGDEE0NF123473", "SUV",        47000.00m, 10, 2025, "All-electric compact crossover.",                        0),
            MakeCar(19, 7,  "Model S",       "5YJSA1E20NF123474", "Sedan",       89000.00m,  5, 2024, "Flagship all-electric performance sedan.",                2),
            MakeCar(20, 8,  "A4",            "WAUENAF40NN123475", "Sedan",       42000.00m, 24, 2024, "Compact executive sedan.",                                6),
            MakeCar(21, 8,  "Q5",            "WA1BNAFY0N2123476", "SUV",        49500.00m, 19, 2024, "Compact luxury crossover SUV.",                          14),
            MakeCar(22, 8,  "e-tron GT",     "WAUZZZFY0N7123477", "Sedan",       104000.00m,  0, 2025, "All-electric grand tourer.",                             1),
            MakeCar(23, 9,  "Elantra",       "KMHL14JA1NA123478", "Sedan",       21500.00m, 21, 2024, "Compact sedan with long warranty coverage.",             16),
            MakeCar(24, 9,  "Tucson",        "5NMJBCAE0NH123479", "SUV",        27500.00m, 26, 2024, "Compact crossover SUV.",                                 10),
            MakeCar(25, 10, "Mazda3",        "3MZBPACL0NM123480", "Hatchback",  23500.00m,  6, 2024, "Sporty compact car.",                                    18),
            MakeCar(26, 10, "CX-5",          "JM3KFBCM0N0123481", "SUV",        28500.00m,  4, 2024, "Compact crossover with upscale interior.",               22),
            MakeCar(27, 10, "MX-5 Miata",    "JM1NDAM76N0123482", "Convertible", 29500.00m,  0, 2025, "Lightweight two-seat roadster.",                          0),

            // Extra units per brand so the "Fleet by brand" mix on the dashboard shows a real, non-tied spread.
            MakeCar(28, 1,  "Corolla Cross", "JTNB6RBX1P3123483", "SUV",         24500.00m, 14, 2025, "Compact crossover built on the Corolla platform.",       0),
            MakeCar(29, 1,  "Highlander",    "5TDGZRBH1PS123484", "SUV",         41500.00m,  9, 2024, "Three-row midsize SUV.",                                  6),
            MakeCar(30, 1,  "Prius",         "JTDKAMFU1P3123485", "Hatchback",   28500.00m, 11, 2024, "Iconic hybrid hatchback.",                                4),
            MakeCar(31, 1,  "Tacoma",        "3TMCZ5AN1PM123486", "Truck",       33500.00m,  7, 2024, "Midsize pickup truck.",                                  10),
            MakeCar(32, 2,  "Escape",        "1FMCU9G61PUA23487", "SUV",         28500.00m, 15, 2024, "Compact crossover SUV.",                                  9),
            MakeCar(33, 2,  "Bronco",        "1FMEE5DP1PLA23488", "SUV",         39500.00m,  6, 2024, "Off-road-focused midsize SUV.",                           2),
            MakeCar(34, 2,  "Ranger",        "1FTER4FH1PLA23489", "Truck",       35500.00m, 12, 2024, "Midsize pickup truck.",                                   8),
            MakeCar(35, 3,  "5 Series",      "WBA53AF0XLC123490", "Sedan",       58500.00m, 16, 2024, "Midsize executive sedan.",                                5),
            MakeCar(36, 3,  "X3",            "5UX43DP0XL9123491", "SUV",         48500.00m, 13, 2024, "Compact luxury SUV.",                                     7),
            MakeCar(37, 4,  "Pilot",         "5FNYF8H50PB123492", "SUV",         38500.00m,  8, 2024, "Three-row midsize SUV.",                                  3),
        };

        db.Cars.AddRange(cars);
    }

    private static void SeedCustomers(CarStoreContext db)
    {
        if (db.Customers.Any())
            return;

        static Customer MakeCustomer(int id, string fullName, string email, string? phoneNumber, DateTime createdAt, int? carId)
        {
            var c = Customer.Create(fullName, email, phoneNumber, carId);
            c.Id = id;
            c.CreatedAt = createdAt;
            return c;
        }

        var customers = new List<Customer>
        {
            MakeCustomer(1,  "Alice Johnson",   "alice.johnson@example.com",   "555-0101", new DateTime(2021, 3, 15, 9, 30, 0, DateTimeKind.Utc), 1),
            MakeCustomer(2,  "Bob Smith",       "bob.smith@example.com",       "555-0102", new DateTime(2021, 9, 2, 14, 15, 0, DateTimeKind.Utc), 34),
            MakeCustomer(3,  "Carol Williams",  "carol.williams@example.com",  null,       new DateTime(2022, 2, 18, 11, 0, 0, DateTimeKind.Utc), 7),
            MakeCustomer(4,  "David Brown",     "david.brown@example.com",     "555-0104", new DateTime(2022, 7, 30, 16, 45, 0, DateTimeKind.Utc), 10),
            MakeCustomer(5,  "Eva Garcia",      "eva.garcia@example.com",      "555-0105", new DateTime(2022, 11, 9, 8, 0, 0, DateTimeKind.Utc), 20),
            MakeCustomer(6,  "Frank Miller",    "frank.miller@example.com",    "555-0106", new DateTime(2023, 1, 22, 10, 20, 0, DateTimeKind.Utc), 4),
            MakeCustomer(7,  "Grace Lee",       "grace.lee@example.com",       "555-0107", new DateTime(2023, 6, 14, 13, 50, 0, DateTimeKind.Utc), 17),
            MakeCustomer(8,  "Henry Wilson",    "henry.wilson@example.com",    null,       new DateTime(2023, 10, 3, 15, 10, 0, DateTimeKind.Utc), null),
            MakeCustomer(9,  "Isabella Martin", "isabella.martin@example.com", "555-0109", new DateTime(2024, 2, 25, 9, 5, 0, DateTimeKind.Utc), 3),
            MakeCustomer(10, "Jack Thompson",   "jack.thompson@example.com",   "555-0110", new DateTime(2024, 8, 11, 12, 40, 0, DateTimeKind.Utc), 15),
            MakeCustomer(11, "Karen White",     "karen.white@example.com",     "555-0111", new DateTime(2025, 1, 15, 9, 30, 0, DateTimeKind.Utc), 2),
            MakeCustomer(12, "Liam Harris",     "liam.harris@example.com",     "555-0112", new DateTime(2025, 4, 5, 16, 45, 0, DateTimeKind.Utc), 8),
            MakeCustomer(13, "Mia Clark",       "mia.clark@example.com",       null,       new DateTime(2025, 9, 28, 8, 0, 0, DateTimeKind.Utc), null),
            MakeCustomer(14, "Noah Lewis",      "noah.lewis@example.com",      "555-0114", new DateTime(2026, 3, 19, 11, 15, 0, DateTimeKind.Utc), 24),
            MakeCustomer(15, "Olivia Walker",   "olivia.walker@example.com",   "555-0115", new DateTime(2026, 7, 8, 14, 25, 0, DateTimeKind.Utc), 12),
        };

        db.Customers.AddRange(customers);
    }
}
