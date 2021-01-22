// SPDX-License-Identifier: MIT
// Copyright (c) 2021 The Pybricks Authors

import {
    FirmwareMetadata,
    FirmwareReaderError,
    FirmwareReaderErrorCode,
} from '@pybricks/firmware';
import JSZip from 'jszip';
import { AsyncSaga } from '../../test';
import {
    FailToStartReasonType,
    didFailToStart,
    didFinish,
    didProgress,
    didStart,
    flashFirmware as flashFirmwareAction,
} from '../actions/flash-firmware';
import {
    BootloaderProgramRequestAction,
    checksumRequest,
    checksumResponse,
    connect,
    didConnect,
    didRequest,
    eraseRequest,
    eraseResponse,
    infoRequest,
    infoResponse,
    initRequest,
    initResponse,
    programRequest,
    programResponse,
    rebootRequest,
} from '../actions/lwp3-bootloader';
import { didCompile } from '../actions/mpy';
import { HubType, Result } from '../protocols/lwp3-bootloader';
import { createCountFunc } from '../utils/iter';
import flashFirmware from './flash-firmware';

afterEach(() => {
    jest.restoreAllMocks();
});

describe('flashFirmware', () => {
    test('normal flow', async () => {
        const metadata: FirmwareMetadata = {
            'metadata-version': '1.0.0',
            'device-id': HubType.MoveHub,
            'checksum-type': 'sum',
            'firmware-version': '1.2.3',
            'max-firmware-size': 1024,
            'mpy-abi-version': 5,
            'mpy-cross-options': ['-mno-unicode'],
            'user-mpy-offset': 100,
        };

        const zip = new JSZip();
        zip.file('firmware-base.bin', new Uint8Array(64));
        zip.file('firmware.metadata.json', JSON.stringify(metadata));
        zip.file('main.py', 'print("test")');
        zip.file('ReadMe_OSS.txt', 'test');

        jest.spyOn(window, 'fetch').mockResolvedValueOnce(
            new Response(await zip.generateAsync({ type: 'blob' })),
        );

        const saga = new AsyncSaga(flashFirmware, { nextMessageId: createCountFunc() });

        saga.setState({ settings: { flashCurrentProgram: false } });

        // saga is triggered by this action

        saga.put(flashFirmwareAction());

        // first step is to connect to the hub bootloader

        let action = await saga.take();
        expect(action).toEqual(connect());

        saga.put(didConnect());

        // then find out what kind of hub it is

        action = await saga.take();
        expect(action).toEqual(infoRequest(0));

        saga.put(didRequest(0));
        saga.put(infoResponse(0x01000000, 0x08005000, 0x081f800, HubType.MoveHub));

        // then compile main.py to .mpy

        action = await saga.take();
        expect(action).toMatchSnapshot();

        const mpySize = 20;
        const mpyBinaryData = new Uint8Array(mpySize);
        saga.put(didCompile(mpyBinaryData));

        // then start flashing the firmware

        // should get didStart action just before starting to erase
        action = await saga.take();
        expect(action).toEqual(didStart());

        // erase first

        action = await saga.take();
        expect(action).toEqual(eraseRequest(1));

        saga.put(didRequest(1));
        saga.put(eraseResponse(Result.OK));

        // then write the new firmware

        const totalFirmwareSize = metadata['user-mpy-offset'] + mpySize + 8;
        action = await saga.take();
        expect(action).toEqual(initRequest(2, totalFirmwareSize));

        saga.put(didRequest(2));
        saga.put(initResponse(Result.OK));

        const dummyPayload = new ArrayBuffer(0);
        let id = 2;
        for (let count = 1, offset = 0; ; count++, offset += 14) {
            action = await saga.take();
            expect(action).toEqual(
                programRequest(++id, 0x08005000 + offset, dummyPayload),
            );
            expect((action as BootloaderProgramRequestAction).payload.byteLength).toBe(
                Math.min(14, totalFirmwareSize - offset),
            );

            saga.put(didRequest(id));

            action = await saga.take();
            expect(action).toEqual(didProgress(offset / totalFirmwareSize));

            // Have to be careful that a checksum request is not sent after
            // last payload is sent, otherwise the hub gets confused.

            if (offset + 14 >= totalFirmwareSize) {
                break;
            }

            if (count % 10 === 0) {
                action = await saga.take();
                expect(action).toEqual(checksumRequest(++id));

                saga.put(didRequest(id));
                saga.put(checksumResponse(0));
            }
        }

        // hub indicates success

        saga.put(programResponse(0, totalFirmwareSize));

        action = await saga.take();
        expect(action).toEqual(didProgress(1));

        // and finally reboot the hub

        action = await saga.take();
        expect(action).toEqual(rebootRequest(++id));

        saga.put(didRequest(id));

        // then we are done

        action = await saga.take();
        expect(action).toEqual(didFinish());

        await saga.end();
    });

    describe('user supplied firmware.zip', () => {
        test('success', async () => {
            const metadata: FirmwareMetadata = {
                'metadata-version': '1.0.0',
                'device-id': HubType.MoveHub,
                'checksum-type': 'sum',
                'firmware-version': '1.2.3',
                'max-firmware-size': 1024,
                'mpy-abi-version': 5,
                'mpy-cross-options': ['-mno-unicode'],
                'user-mpy-offset': 100,
            };

            const zip = new JSZip();
            zip.file('firmware-base.bin', new Uint8Array(64));
            zip.file('firmware.metadata.json', JSON.stringify(metadata));
            zip.file('main.py', 'print("test")');
            zip.file('ReadMe_OSS.txt', 'test');

            const saga = new AsyncSaga(flashFirmware, {
                nextMessageId: createCountFunc(),
            });

            saga.setState({ settings: { flashCurrentProgram: false } });

            // saga is triggered by this action

            saga.put(
                flashFirmwareAction(await zip.generateAsync({ type: 'arraybuffer' })),
            );

            // the first step is to compile main.py to .mpy

            let action = await saga.take();
            expect(action).toMatchSnapshot();

            const mpySize = 20;
            const mpyBinaryData = new Uint8Array(mpySize);
            saga.put(didCompile(mpyBinaryData));

            // then connect to the hub bootloader

            action = await saga.take();
            expect(action).toEqual(connect());

            saga.put(didConnect());

            // then find out what kind of hub it is

            action = await saga.take();
            expect(action).toEqual(infoRequest(0));

            saga.put(didRequest(0));
            saga.put(infoResponse(0x01000000, 0x08005000, 0x081f800, HubType.MoveHub));

            // then start flashing the firmware

            // should get didStart action just before starting to erase
            action = await saga.take();
            expect(action).toEqual(didStart());

            // erase first

            action = await saga.take();
            expect(action).toEqual(eraseRequest(1));

            saga.put(didRequest(1));
            saga.put(eraseResponse(Result.OK));

            // then write the new firmware

            const totalFirmwareSize = metadata['user-mpy-offset'] + mpySize + 8;
            action = await saga.take();
            expect(action).toEqual(initRequest(2, totalFirmwareSize));

            saga.put(didRequest(2));
            saga.put(initResponse(Result.OK));

            const dummyPayload = new ArrayBuffer(0);
            let id = 2;
            for (let count = 1, offset = 0; ; count++, offset += 14) {
                action = await saga.take();
                expect(action).toEqual(
                    programRequest(++id, 0x08005000 + offset, dummyPayload),
                );
                expect(
                    (action as BootloaderProgramRequestAction).payload.byteLength,
                ).toBe(Math.min(14, totalFirmwareSize - offset));

                saga.put(didRequest(id));

                action = await saga.take();
                expect(action).toEqual(didProgress(offset / totalFirmwareSize));

                // Have to be careful that a checksum request is not sent after
                // last payload is sent, otherwise the hub gets confused.

                if (offset + 14 >= totalFirmwareSize) {
                    break;
                }

                if (count % 10 === 0) {
                    action = await saga.take();
                    expect(action).toEqual(checksumRequest(++id));

                    saga.put(didRequest(id));
                    saga.put(checksumResponse(0));
                }
            }

            // hub indicates success

            saga.put(programResponse(0, totalFirmwareSize));

            action = await saga.take();
            expect(action).toEqual(didProgress(1));

            // and finally reboot the hub

            action = await saga.take();
            expect(action).toEqual(rebootRequest(++id));

            saga.put(didRequest(id));

            // then we are done

            action = await saga.take();
            expect(action).toEqual(didFinish());

            await saga.end();
        });

        test('zip error', async () => {
            const metadata: FirmwareMetadata = {
                'metadata-version': '1.0.0',
                'device-id': HubType.MoveHub,
                'checksum-type': 'sum',
                'firmware-version': '1.2.3',
                'max-firmware-size': 1024,
                'mpy-abi-version': 5,
                'mpy-cross-options': ['-mno-unicode'],
                'user-mpy-offset': 100,
            };

            const zip = new JSZip();
            // no firmware-base.bin - triggers zip error
            zip.file('firmware.metadata.json', JSON.stringify(metadata));
            zip.file('main.py', 'print("test")');
            zip.file('ReadMe_OSS.txt', 'test');

            const saga = new AsyncSaga(flashFirmware, {
                nextMessageId: createCountFunc(),
            });

            saga.setState({ settings: { flashCurrentProgram: false } });

            // saga is triggered by this action

            saga.put(
                flashFirmwareAction(await zip.generateAsync({ type: 'arraybuffer' })),
            );

            // should get failure due to missing file

            const action = await saga.take();
            expect(action).toStrictEqual(
                didFailToStart(
                    FailToStartReasonType.ZipError,
                    new FirmwareReaderError(
                        FirmwareReaderErrorCode.MissingFirmwareBaseBin,
                    ),
                ),
            );

            await saga.end();
        });
    });

    test('user supplied main.py', async () => {
        const metadata: FirmwareMetadata = {
            'metadata-version': '1.0.0',
            'device-id': HubType.MoveHub,
            'checksum-type': 'sum',
            'firmware-version': '1.2.3',
            'max-firmware-size': 1024,
            'mpy-abi-version': 5,
            'mpy-cross-options': ['-mno-unicode'],
            'user-mpy-offset': 100,
        };

        const zip = new JSZip();
        zip.file('firmware-base.bin', new Uint8Array(64));
        zip.file('firmware.metadata.json', JSON.stringify(metadata));
        zip.file('main.py', 'print("test")');
        zip.file('ReadMe_OSS.txt', 'test');

        jest.spyOn(window, 'fetch').mockResolvedValueOnce(
            new Response(await zip.generateAsync({ type: 'blob' })),
        );

        const editor = {
            getValue: () => 'print("test")',
        };

        const saga = new AsyncSaga(flashFirmware, { nextMessageId: createCountFunc() });

        saga.setState({
            editor: { current: editor },
            settings: { flashCurrentProgram: true },
        });

        // saga is triggered by this action

        saga.put(flashFirmwareAction());

        // first step is to connect to the hub bootloader

        let action = await saga.take();
        expect(action).toEqual(connect());

        saga.put(didConnect());

        // then find out what kind of hub it is

        action = await saga.take();
        expect(action).toEqual(infoRequest(0));

        saga.put(didRequest(0));
        saga.put(infoResponse(0x01000000, 0x08005000, 0x081f800, HubType.MoveHub));

        // then compile main.py to .mpy

        action = await saga.take();
        expect(action).toMatchSnapshot();

        const mpySize = 20;
        const mpyBinaryData = new Uint8Array(mpySize);
        saga.put(didCompile(mpyBinaryData));

        // then start flashing the firmware

        // should get didStart action just before starting to erase
        action = await saga.take();
        expect(action).toEqual(didStart());

        // erase first

        action = await saga.take();
        expect(action).toEqual(eraseRequest(1));

        saga.put(didRequest(1));
        saga.put(eraseResponse(Result.OK));

        // then write the new firmware

        const totalFirmwareSize = metadata['user-mpy-offset'] + mpySize + 8;
        action = await saga.take();
        expect(action).toEqual(initRequest(2, totalFirmwareSize));

        saga.put(didRequest(2));
        saga.put(initResponse(Result.OK));

        const dummyPayload = new ArrayBuffer(0);
        let id = 2;
        for (let count = 1, offset = 0; ; count++, offset += 14) {
            action = await saga.take();
            expect(action).toEqual(
                programRequest(++id, 0x08005000 + offset, dummyPayload),
            );
            expect((action as BootloaderProgramRequestAction).payload.byteLength).toBe(
                Math.min(14, totalFirmwareSize - offset),
            );

            saga.put(didRequest(id));

            action = await saga.take();
            expect(action).toEqual(didProgress(offset / totalFirmwareSize));

            // Have to be careful that a checksum request is not sent after
            // last payload is sent, otherwise the hub gets confused.

            if (offset + 14 >= totalFirmwareSize) {
                break;
            }

            if (count % 10 === 0) {
                action = await saga.take();
                expect(action).toEqual(checksumRequest(++id));

                saga.put(didRequest(id));
                saga.put(checksumResponse(0));
            }
        }

        // hub indicates success

        saga.put(programResponse(0, totalFirmwareSize));

        action = await saga.take();
        expect(action).toEqual(didProgress(1));

        // and finally reboot the hub

        action = await saga.take();
        expect(action).toEqual(rebootRequest(++id));

        saga.put(didRequest(id));

        // then we are done

        action = await saga.take();
        expect(action).toEqual(didFinish());

        await saga.end();
    });
});