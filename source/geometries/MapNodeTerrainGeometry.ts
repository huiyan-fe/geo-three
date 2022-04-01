/* eslint-disable indent */
import {BufferGeometry, Float32BufferAttribute, Vector3} from 'three';

export class MapNodeTerrainGeometry extends BufferGeometry
{
	/**
	 * Map node geometry constructor.
	 *
	 * @param width - Width of the node.
	 * @param height - Height of the node.
	 * @param widthSegments - Number of subdivisions along the width.
	 * @param heightSegments - Number of subdivisions along the height.
	 * @param skirt - Skirt around the plane to mask gaps between tiles.
	 */
	public constructor(geometryWidth: number = 1.0, geometryHeight: number = 1.0, skirt: boolean = false, skirtDepth: number = 10.0, buffer: Buffer = null, calculateNormals: boolean = true)
	{
		super();

		let offset = 0;
        let centerX = buffer.readDoubleLE(offset);
        offset += 8;
        let centerY = buffer.readDoubleLE(offset);
        offset += 8;
        let centerZ = buffer.readDoubleLE(offset);
        offset += 8;
        // console.log(centerX, centerY, centerZ);

        let MinimumHeight = buffer.readFloatLE(offset);
        offset += 4;
        let MaximumHeight = buffer.readFloatLE(offset);
        offset += 4;
        // console.log(MinimumHeight, MaximumHeight);

        let BoundingSphereCenterX = buffer.readDoubleLE(offset);
        offset += 8;
        let BoundingSphereCenterY = buffer.readDoubleLE(offset);
        offset += 8;
        let BoundingSphereCenterZ = buffer.readDoubleLE(offset);
        offset += 8;
        let BoundingSphereRadius = buffer.readDoubleLE(offset);
        offset += 8;
        // console.log(BoundingSphereCenterX, BoundingSphereCenterY, BoundingSphereCenterZ, BoundingSphereRadius);

        let HorizonOcclusionPointX = buffer.readDoubleLE(offset);
        offset += 8;
        let HorizonOcclusionPointY = buffer.readDoubleLE(offset);
        offset += 8;
        let HorizonOcclusionPointZ = buffer.readDoubleLE(offset);
        offset += 8;
        // console.log(HorizonOcclusionPointX, HorizonOcclusionPointY, HorizonOcclusionPointZ);

        let vertexCount = buffer.readUInt32LE(offset);
        offset += 4;
        let uBuffer = buffer.slice(offset, offset + vertexCount * 2);
        offset += vertexCount * 2;
        let vBuffer = buffer.slice(offset, offset + vertexCount * 2);
        offset += vertexCount * 2;
        let heightBuffer = buffer.slice(offset, offset + vertexCount * 2);
        offset += vertexCount * 2;

        uBuffer = new Uint16Array(uBuffer.buffer, uBuffer.byteOffset, uBuffer.byteLength / 2);
        vBuffer = new Uint16Array(vBuffer.buffer, vBuffer.byteOffset, vBuffer.byteLength / 2);
        heightBuffer = new Uint16Array(heightBuffer.buffer, heightBuffer.byteOffset, heightBuffer.byteLength / 2);

        let u = 0;
        let v = 0;
        let height = 0;

        for (let i = 0; i < vertexCount; ++i)
        {
            u += this.zigZagDecode(uBuffer[i]);
            v += this.zigZagDecode(vBuffer[i]);
            height += this.zigZagDecode(heightBuffer[i]);

            uBuffer[i] = u;
            vBuffer[i] = v;
            heightBuffer[i] = height;
        }
        // console.log(vertexCount);
        // console.log('offset:', offset);

        let triangleCount = buffer.readUInt32LE(offset);
        offset += 4;
        // console.log(triangleCount);

        let indices = null;
        if (triangleCount <= 65536)
        {
            indices = buffer.slice(offset, offset + triangleCount * 2 * 3);
            offset += triangleCount * 2 * 3;
            indices = new Uint16Array(indices.buffer, indices.byteOffset, indices.byteLength / 2);
        }
        
        this.decodeIndices(indices);

        let westIndices = null;
        let southIndices = null;
        let eastIndices = null;
        let northIndices = null;
        if (triangleCount <= 65536)
        {
            let westVertexCount = buffer.readUInt32LE(offset);
            offset += 4;
            westIndices = buffer.slice(offset, offset + westVertexCount * 2);
            offset += westVertexCount * 2;
            westIndices = new Uint16Array(westIndices.buffer, westIndices.byteOffset, westIndices.byteLength / 2);
            // decodeIndices(westIndices);

            let southVertexCount = buffer.readUInt32LE(offset);
            offset += 4;
            southIndices = buffer.slice(offset, offset + southVertexCount * 2);
            offset += southVertexCount * 2;
            southIndices = new Uint16Array(southIndices.buffer, southIndices.byteOffset, southIndices.byteLength / 2);
            // decodeIndices(southIndices);

            let eastVertexCount = buffer.readUInt32LE(offset);
            offset += 4;
            eastIndices = buffer.slice(offset, offset + eastVertexCount * 2);
            offset += eastVertexCount * 2;
            eastIndices = new Uint16Array(eastIndices.buffer, eastIndices.byteOffset, eastIndices.byteLength / 2);
            // decodeIndices(eastIndices);

            let northVertexCount = buffer.readUInt32LE(offset);
            offset += 4;
            northIndices = buffer.slice(offset, offset + northVertexCount * 2);
            offset += northVertexCount * 2;
            northIndices = new Uint16Array(northIndices.buffer, northIndices.byteOffset, northIndices.byteLength / 2);
            // decodeIndices(northIndices);

            // console.log(westVertexCount, southVertexCount, eastVertexCount, northVertexCount);
            // console.log(westIndices, southIndices, eastIndices, northIndices);
        }
        // console.log(buffer.byteLength, offset);
        let extensionId = buffer[offset];
        offset += 1;
        let extensionLength = buffer.readUInt32LE(offset);
        offset += 4;
        // console.log(extensionId, extensionLength);

        let positions = [];
        const coordScaleFactorWidth = geometryWidth / 32767;
        const coordScaleFactorHeight = geometryHeight / 32767;
        for (let i = 0; i < vertexCount; i++)
        {
            positions.push(uBuffer[i] * coordScaleFactorWidth);
            positions.push(heightBuffer[i]);
            positions.push(vBuffer[i] * coordScaleFactorHeight);
        }

        indices = Array.from(indices);
        if (skirt)
        {
            this.addSkirt(positions, indices, westIndices, skirtDepth);
            this.addSkirt(positions, indices, southIndices, skirtDepth);
            this.addSkirt(positions, indices, eastIndices, skirtDepth);
            this.addSkirt(positions, indices, northIndices, skirtDepth);
        }
        const uvs = this.calculateUvFromPositions(positions);

        this.attributes.position = new Float32BufferAttribute(positions, 3);
        this.attributes.uv = new Float32BufferAttribute(uvs, 3);
        this.computeVertexNormals();
	}

    private calculateUvFromPositions(positions: number[]): number[]
    {
        const uvs = [];
        for (let i = 0, length = positions.length - 2; i < length; i += 3)
        {
            uvs.push(
                positions[i],
                positions[i + 2],
            );
        }
        return uvs;
    }

	private zigZagDecode(value: number): number
    {
        return (value >> 1) ^ (-(value & 1));
    }

    private decodeIndices(indices: number[]): void
    {
        let highest = 0;
        for (let i = 0; i < indices.length; ++i) {
            let code = indices[i];
            indices[i] = highest - code;
            if (code === 0)
            {
                ++highest;
            }
        }
    }

    private addSkirt(positions: number[], indices: number[], skirtVertexIndices: number[], skirtHeight: number = 10000): void
    {
        const vertexCount = positions.length / 3;
        for (let i = 0; i < skirtVertexIndices.length; i++)
        {
            /**
             * tl -   tr
             * |  /  / |
             * bl   - br
             */
            const tr = skirtVertexIndices[i];
            let x = positions[tr * 3];
            let y = positions[tr * 3 + 1];
            let z = positions[tr * 3 + 2];
            positions.push(x, y - skirtHeight, z);
            if (i === 0)
            {
                continue;
            }
            const tl = skirtVertexIndices[i - 1];
            const br = vertexCount + i;
            const bl = br - 1;
            indices.push(
                tl, bl, tr,
                tr, bl, br
            );
        }
    }
}
