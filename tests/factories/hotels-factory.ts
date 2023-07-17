import faker from '@faker-js/faker';
import { Hotel, Room } from '@prisma/client';
import { prisma } from '@/config';

export function createFakeHotel(): Promise<Hotel> {
  return prisma.hotel.create({
    data: {
      name: faker.company.companyName(),
      image: faker.image.imageUrl()
    },
  });
}

export function createFakeRoom(hotelId: number): Promise<Room>{
    return prisma.room.create({
        data: {
            name: faker.company.companyName(),
            capacity: faker.datatype.number({min: 1, max: 100}),
            hotelId
        }
    });
}