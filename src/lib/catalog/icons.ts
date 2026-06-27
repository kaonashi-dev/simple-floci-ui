/**
 * The single icon-name → component map. Previously this lookup was copy-pasted
 * into eight Svelte files (sidebar, dashboard, both overviews, both service
 * placeholders). Now every surface renders icons through this one table, so
 * adding an icon or re-skinning a service touches exactly one place.
 */
import BoxesIcon from '@lucide/svelte/icons/boxes';
import DatabaseIcon from '@lucide/svelte/icons/database';
import HardDriveIcon from '@lucide/svelte/icons/hard-drive';
import KeyRoundIcon from '@lucide/svelte/icons/key-round';
import LockIcon from '@lucide/svelte/icons/lock';
import MessageSquareIcon from '@lucide/svelte/icons/message-square';
import NetworkIcon from '@lucide/svelte/icons/network';
import RadioTowerIcon from '@lucide/svelte/icons/radio-tower';
import ScrollTextIcon from '@lucide/svelte/icons/scroll-text';
import ShieldIcon from '@lucide/svelte/icons/shield';
import SigmaIcon from '@lucide/svelte/icons/sigma';
import SlidersIcon from '@lucide/svelte/icons/sliders';
import UsersRoundIcon from '@lucide/svelte/icons/users-round';
import ZapIcon from '@lucide/svelte/icons/zap';
import type { ServiceIcon } from './types';

export type ServiceIconComponent = typeof BoxesIcon;

export const serviceIcons: Record<ServiceIcon, ServiceIconComponent> = {
	storage: HardDriveIcon,
	messaging: MessageSquareIcon,
	notifications: RadioTowerIcon,
	database: DatabaseIcon,
	serverless: SigmaIcon,
	compute: ZapIcon,
	containers: BoxesIcon,
	config: SlidersIcon,
	security: KeyRoundIcon,
	secret: LockIcon,
	shield: ShieldIcon,
	networking: NetworkIcon,
	observability: ScrollTextIcon,
	identity: UsersRoundIcon
};
