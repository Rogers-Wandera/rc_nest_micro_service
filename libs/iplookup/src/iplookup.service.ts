import { Injectable, OnModuleInit } from '@nestjs/common';
import * as maxmind from 'maxmind';
import * as geoip from 'geoip-lite';
import path from 'path';

@Injectable()
export class IplookupService implements OnModuleInit {
  private dbReader: maxmind.Reader<any>;
  async onModuleInit() {
    await this.loadDatabase();
  }

  private async loadDatabase() {
    const geoLite2Path = path.join(__dirname, 'assets', 'GeoLite2-City.mmdb');
    this.dbReader = await maxmind.open(geoLite2Path);
  }

  async getIpInfo(ip: string) {
    if (!ip || ip === '::1' || ip.startsWith('127.')) return null;
    const geo = this.dbReader.get(ip);
    if (geo) {
      return {
        city: geo.city?.names?.en || 'Unknown',
        country: geo.country?.names?.en || 'Unknown',
        lat: geo.location?.latitude || 'Unknown',
        lon: geo.location?.longitude || 'Unknown',
      };
    }

    // geoip-lite Fallback
    const geoLite = geoip.lookup(ip);
    if (geoLite) {
      return {
        city: geoLite.city || 'Unknown',
        country: geoLite.country || 'Unknown',
        lat: geoLite.ll[0],
        lon: geoLite.ll[1],
      };
    }

    return null;
  }
}
