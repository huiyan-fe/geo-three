/* eslint-disable indent  */
import {MapProvider} from './MapProvider';
import {XHRUtils} from '../utils/XHRUtils';

/**
 * Cesium地形格式数据
 */
export class TerrainProvider extends MapProvider 
{
	public url: string;

	/**
	 * @param url - Tile size.
	 */
	public constructor(options: Object = {}) 
	{
		super();
        this.getUrl = options.getUrl;
	}


	public getMetaData(): void {}

	public fetchTile(zoom: number, x: number, y: number): Promise<any>
	{
        const address = this.getUrl(zoom, x, y);
        
		return new Promise((resolve, reject) => 
		{
			XHRUtils.get(address, (data: any) =>
            {
                resolve(data);
            }, () =>
            {
                reject();
            });
		});
	}
}
