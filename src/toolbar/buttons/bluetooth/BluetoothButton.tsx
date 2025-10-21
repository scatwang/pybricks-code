// SPDX-License-Identifier: MIT
// Copyright (c) 2020-2025 The Pybricks Authors

import React from 'react';
import { useDispatch } from 'react-redux';
import { toggleBluetooth } from '../../../ble/actions';
import { BleConnectionState } from '../../../ble/reducers';
import { BootloaderConnectionState } from '../../../lwp3-bootloader/reducers';
import { useSelector } from '../../../reducers';
import { UsbConnectionState } from '../../../usb/reducers';
import ActionButton, { ActionButtonProps } from '../../ActionButton';
import connectedIcon from './connected.svg';
import disconnectedIcon from './disconnected.svg';
import { useI18n } from './i18n';

type BluetoothButtonProps = Pick<ActionButtonProps, 'id'>;

const BluetoothButton: React.FunctionComponent<BluetoothButtonProps> = ({ id }) => {
    const bootloaderConnection = useSelector((s) => s.bootloader.connection);
    const bleConnection = useSelector((s) => s.ble.connection);
    const usbConnection = useSelector((s) => s.usb.connection);

    const isBluetoothDisconnected =
        bootloaderConnection === BootloaderConnectionState.Disconnected &&
        bleConnection === BleConnectionState.Disconnected;
    const isEverythingDisconnected =
        isBluetoothDisconnected && usbConnection === UsbConnectionState.Disconnected;

    const i18n = useI18n();
    const dispatch = useDispatch();

    return (
        <ActionButton
            id={id}
            label={i18n.translate('label')}
            tooltip={i18n.translate(
                usbConnection !== UsbConnectionState.Disconnected
                    ? 'tooltip.usbConnected'
                    : isBluetoothDisconnected
                      ? 'tooltip.connect'
                      : 'tooltip.disconnect',
            )}
            icon={isBluetoothDisconnected ? disconnectedIcon : connectedIcon}
            enabled={
                isEverythingDisconnected ||
                bleConnection === BleConnectionState.Connected
            }
            showProgress={
                bleConnection === BleConnectionState.Connecting ||
                bleConnection === BleConnectionState.Disconnecting
            }
            onAction={() => dispatch(toggleBluetooth())}
        />
    );
};

export default BluetoothButton;
