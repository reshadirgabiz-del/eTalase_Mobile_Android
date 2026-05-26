import { Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { SupabaseService } from '../common/supabase/supabase.service';
import { DeliveryEstimateDto } from './dto/delivery-estimate.dto';

@Injectable()
export class DeliveryService {
  constructor(private readonly supabase: SupabaseService) {}

  async estimate(dto: DeliveryEstimateDto) {
    const { data: settings, error } = await this.supabase.client
      .from('settings')
      .select('origin_lat, origin_lng')
      .eq('store_id', dto.storeId)
      .single();

    if (error || !settings) throw new NotFoundException('Store settings not found');

    if (settings.origin_lat == null || settings.origin_lng == null) {
      throw new NotFoundException('Alamat asal toko belum dikonfigurasi');
    }

    const response = await axios.post(
      `${process.env.BITESHIP_API_URL}/rates/couriers`,
      {
        origin_latitude: settings.origin_lat,
        origin_longitude: settings.origin_lng,
        destination_latitude: dto.destinationLat,
        destination_longitude: dto.destinationLng,
        couriers: 'jne,sicepat,jnt',
        items: [{ name: 'Package', value: 1, weight: dto.totalWeightGrams }],
      },
      { headers: { Authorization: `Bearer ${process.env.BITESHIP_API_KEY}` } },
    );

    return (response.data.pricing ?? []).map((rate: any) => ({
      courierId: rate.courier_code,
      courierName: rate.courier_name,
      courierCode: rate.courier_code,
      serviceName: rate.courier_service_name,
      serviceType: rate.type,
      price: rate.price,
      estimatedDays: rate.shipment_duration_range,
    }));
  }
}
