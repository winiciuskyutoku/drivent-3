import { getTickets } from "@/controllers"
import hotelsRepository from "@/repositories/hotels-repository"
import ticketService from "../tickets-service"
import { notFoundError } from "@/errors"
import enrollmentsService from "../enrollments-service"
import ticketsRepository from "@/repositories/tickets-repository"
import { paymentRequired } from "./error"

async function serviceValidation(userId: number){
    const checkTicket = await ticketService.getTicketByUserId(userId)
    const checkEnrollment = await enrollmentsService.getOneWithAddressByUserId(userId)
    if(!checkTicket || !checkEnrollment) throw notFoundError()
    if(checkTicket.status === 'RESERVED') throw paymentRequired()

    const checkTicketType = await ticketsRepository.findTickeWithTypeById(checkTicket.id)
    if(checkTicketType.TicketType.isRemote === true || checkTicketType.TicketType.includesHotel === false) throw paymentRequired()
}

async function getHotels(userId: number){
    await serviceValidation(userId)

    const result = await hotelsRepository.getHotels()
    if(!result[0]) throw notFoundError()

    return result
}

async function getHotelsRoom(hotelId: number, userId: number){
    await serviceValidation(userId)

    const result = await hotelsRepository.getHotelsRoom(hotelId)
    if(!result) throw notFoundError()

    return result
}

const hotelsService = {
    getHotels,
    getHotelsRoom
}

export default hotelsService