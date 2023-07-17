import { prisma } from "@/config";

async function getHotels(){
    return await prisma.hotel.findMany()
}

async function getHotelsRoom(hotelId: number){
    return await prisma.hotel.findFirst({
        where: {
            id: hotelId 
        },
        include: {
            Rooms: true
        }
    })
}

const hotelsRepository = {
    getHotels,
    getHotelsRoom
}

export default hotelsRepository