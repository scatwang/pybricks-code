// SPDX-License-Identifier: MIT
// Copyright (c) 2022 The Pybricks Authors

import { Intent } from '@blueprintjs/core';
import React from 'react';
import { CreateToast } from '../../i18nToaster';
import { useI18n } from './i18n';

const ReleaseButton: React.VoidFunctionComponent = () => {
    const i18n = useI18n();
    return <p>{i18n.translate('releaseButton.message')}</p>;
};

export const releaseButton: CreateToast = (onAction) => {
    return {
        message: <ReleaseButton />,
        icon: 'info-sign',
        intent: Intent.PRIMARY,
        onDismiss: () => onAction('dismiss'),
    };
};