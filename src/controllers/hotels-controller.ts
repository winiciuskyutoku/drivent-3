import { notFoundError } from "@/errors";
import { AuthenticatedRequest } from "@/middlewares";
import hotelsService from "@/services/hotels-service";
import { Response } from "express";
import httpStatus from "http-status";

export async function getHotels(req: AuthenticatedRequest, res: Response){
    const userId = req.userId

    try{
        const result = await hotelsService.getHotels(userId) 

        res.send(result)
    } catch(err){
        if(err.name === 'NotFoundError') return res.status(httpStatus.NOT_FOUND).send(err.message)
        if(err.name === 'PaymentRequired') return res.status(httpStatus.PAYMENT_REQUIRED).send(err.message)
        res.status(httpStatus.BAD_REQUEST).send(err.message)
    }
} 

export async function getHotelsRoom(req: AuthenticatedRequest, res: Response){
    const {hotelId} = req.params
    const id = Number(hotelId)
    const userId = req.userId

    try{
        const result = await hotelsService.getHotelsRoom(id, userId)

        res.send(result)
    } catch(err){
        if(err.name === 'NotFoundError') return res.status(httpStatus.NOT_FOUND).send(err.message)
        if(err.name === 'PaymentRequired') return res.status(httpStatus.PAYMENT_REQUIRED).send(err.message)
        res.status(httpStatus.BAD_REQUEST).send(err.message)
    }
}