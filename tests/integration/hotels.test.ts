import app, { init } from "@/app"
import { cleanDb, generateValidToken } from "../helpers"
import supertest from "supertest"
import httpStatus from "http-status"
import faker from "@faker-js/faker"
import { createEnrollmentWithAddress, createHotelTicket, createPayment, createTicket, createTicketType, createUser } from "../factories"
import * as jwt from 'jsonwebtoken';
import { TicketStatus } from "@prisma/client"
import { createFakeHotel, createFakeRoom } from "../factories/hotels-factory"

beforeAll(async () => {
    init(),
    cleanDb()
})

beforeEach(async () => {
    cleanDb()
})

const server = supertest(app)

describe('GET /hotels', () => {
    it('should respond with status 401 if no token is given', async () => {
        const response = await server.get('/hotels');

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if given token is not valid', async () => {
        const token = faker.lorem.word();

        const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if there is no session for given token', async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

        const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe('When token is valid', () => {
        it('Should respond with status 404 if there is no subscription', async () => {
            const user = await createUser()
            const token = await generateValidToken(user)

            const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`)

            expect(response.status).toEqual(httpStatus.NOT_FOUND)
        })

        it('Should respond with status 404 if there is subscription but no ticket', async () => {
            const user = await createUser()
            const token = await generateValidToken(user)
            await createEnrollmentWithAddress(user);

            const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`)

            expect(response.status).toEqual(httpStatus.NOT_FOUND)
        })

        it('Should respond with status 404 if there is subscription and ticket bot not hotel', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createHotelTicket(true, false);
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

            await createPayment(ticket.id, ticketType.price);

            const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`)

            expect(response.status).toEqual(httpStatus.NOT_FOUND)
        })

        it('Should respond with status 402 if there is no payment', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createHotelTicket(true, false);
            await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

            const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`)

            expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED)
        })

        it('Should respond with status 402 there is payment but ticket does not includes hotel', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createHotelTicket(false, false);
            await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

            const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`)

            expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED)
        })

        it('Should respond with status 402 there is payment but tickcet is remote', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createHotelTicket(false, true);
            await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

            const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`)

            expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED)
        })

        it('Should respond with status 200 if there is sucess', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createHotelTicket(true, false);
            await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            await createFakeHotel()

            const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`)

            expect(response.status).toEqual(httpStatus.OK)
        })
    })
})

describe('GET /hotels/:hotelId', () => {
    it('should respond with status 401 if no token is given', async () => {
        const response = await server.get('/hotels/1');

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if given token is not valid', async () => {
        const token = faker.lorem.word();

        const response = await server.get('/hotels/999').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if there is no session for given token', async () => {
        const user = await createUser();
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

        const response = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe('when token is valid', () => {
        it('Should respond with status 404 if there is no subscription', async () => {
            const token = await generateValidToken();

            const response = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.NOT_FOUND);
        });

        it('Should respond with status 404 if there is subscription but no ticket', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            await createEnrollmentWithAddress(user);

            const response = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
            expect(response.status).toEqual(httpStatus.NOT_FOUND);
        });

        it('Should respond with status 404 if there is subscription and ticket bot not hotel', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createHotelTicket(true, false);
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

            await createPayment(ticket.id, ticketType.price);

            const response = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
            expect(response.status).toEqual(httpStatus.NOT_FOUND);
        });

        it('Should response with status 402 if there is no payment', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketType();
            await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

            const response = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
            expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
        });

        it('Should respond with status 402 there is payment but tickcet is remote', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createHotelTicket(false, true);
            await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

            const response = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
            expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
        });

        it('Should respond with status 402 there is payment but ticket does not includes hotel', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createHotelTicket(false, false);
            await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

            const response = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
            expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
        });

        it('Should respond with status 200 if there is sucess', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createHotelTicket(true, false);
            await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const hotel = await createFakeHotel();
            for (let i = 0; i < 2; i++) {
                await createFakeRoom(hotel.id);
            }

            const response = await server.get(`/hotels/${hotel.id}`).set('Authorization', `Bearer ${token}`);
            expect(response.status).toEqual(httpStatus.OK);
            expect(response.body).toEqual(
                {
                    id: expect.any(Number),
                    name: expect.any(String),
                    image: expect.any(String),
                    createdAt: expect.any(String),
                    updatedAt: expect.any(String),
                    Rooms: expect.arrayContaining([{
                        id: expect.any(Number),
                        name: expect.any(String),
                        capacity: expect.any(Number),
                        hotelId: expect.any(Number),
                        createdAt: expect.any(String),
                        updatedAt: expect.any(String),
                    }])
                }
            );
        });
    });
});