// SPDX-License-Identifier: MIT
// Copyright (c) 2020-2021 The Pybricks Authors

import {
    Button,
    Intent,
    Position,
    Spinner,
    Tooltip,
    useHotkeys,
} from '@blueprintjs/core';
import { useI18n } from '@shopify/react-i18n';
import React, { useMemo, useRef } from 'react';
import { tooltipDelay } from '../app/constants';
import { TooltipId } from './i18n';
import en from './i18n.en.json';

export interface ActionButtonProps {
    /** A unique id for each instance. */
    readonly id: string;
    /** Keyboard shortcut. */
    readonly keyboardShortcut?: string;
    /** Tooltip text that appears when hovering over the button. */
    readonly tooltip: TooltipId;
    /** Tooltip text that appears when hovering over the button and @showProgress is true. */
    readonly progressTooltip?: TooltipId;
    /** Icon shown on the button. */
    readonly icon: string;
    /** When true or undefined, the button is enabled. */
    readonly enabled?: boolean;
    /** When true, show progress indicator instead of icon. */
    readonly showProgress?: boolean;
    /** The progress value (0 to 1) or undefined for indeterminate progress. */
    readonly progress?: number;
    /** Callback that is called when the button is activated (clicked). */
    readonly onAction: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = (props) => {
    const buttonRef = useRef<Button>(null);

    const [i18n] = useI18n({ id: 'actionButton', translations: { en }, fallback: en });

    const tooltipText =
        props.showProgress && props.progressTooltip
            ? i18n.translate(props.progressTooltip, {
                  percent:
                      props.progress === undefined
                          ? ''
                          : i18n.formatPercentage(props.progress),
              })
            : i18n.translate(props.tooltip) +
              (props.keyboardShortcut ? ` (${props.keyboardShortcut})` : '');

    const hotkeys = useMemo(() => {
        if (!props.keyboardShortcut) {
            return [];
        }

        return [
            {
                global: true,
                allowInInput: true,
                preventDefault: true,
                combo: props.keyboardShortcut.replaceAll('-', '+'),
                label: i18n.translate(props.tooltip),
                onKeyDown: () => {
                    if (props.enabled) {
                        props.onAction();
                    }
                },
            },
        ];
    }, [props, i18n]);

    useHotkeys(hotkeys);

    return (
        <Tooltip
            content={tooltipText}
            position={Position.BOTTOM}
            hoverOpenDelay={tooltipDelay}
        >
            <Button
                ref={buttonRef}
                intent={Intent.PRIMARY}
                onMouseDown={(e) => e.preventDefault()} // prevent focus
                onClick={(): void => props.onAction()}
                disabled={props.enabled === false}
                className="no-box-shadow"
                style={props.enabled === false ? { pointerEvents: 'none' } : undefined}
            >
                {props.showProgress ? (
                    <Spinner value={props.progress} intent={Intent.PRIMARY} />
                ) : (
                    <img src={props.icon} alt={props.id} />
                )}
            </Button>
        </Tooltip>
    );
};

export default ActionButton;
