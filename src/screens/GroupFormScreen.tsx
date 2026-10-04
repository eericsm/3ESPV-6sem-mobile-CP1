import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Avatar } from '../components/Avatar';
import { ErrorMessage } from '../components/ErrorMessage';
import { GroupMemberItem } from '../components/GroupMemberItem';
import { UsersScreen } from './UsersScreen';
import {
    addMember,
    createGroup,
    removeMember,
    updateGroupPhoto,
    updateMemberLimit,
    updateNotificationPolicy,
} from '../services/groupService';
import { getUsersByIds, uploadGroupPhoto } from '../services/userService';
import { pickImageFromLibrary } from '../utils/imagePicker';
import { availableSlots, isGroupOwner } from '../utils/groupValidation';
import type { ChatGroup, NotificationPolicy } from '../types/group';
import type { ChatUser } from '../types/user';

type GroupFormScreenProps = {
    currentUser: ChatUser;
    existingGroup: ChatGroup | null;
    onBack: () => void;
    onSaved: (group: ChatGroup) => void;
};

const POLICY_OPTIONS: { value: NotificationPolicy; label: string }[] = [
    { value: 'all_group_messages', label: 'Todas as mensagens do grupo' },
    { value: 'mentioned_members', label: 'Somente integrantes mencionados' },
    { value: 'direct_messages_only', label: 'Somente mensagens diretas' },
    { value: 'disabled', label: 'Desativado' },
];

export const GroupFormScreen = ({ currentUser, existingGroup, onBack, onSaved }: GroupFormScreenProps) => {
    const isEditing = existingGroup !== null;
    const isOwner = existingGroup ? isGroupOwner(existingGroup, currentUser.uid) : true;

    const [name, setName] = useState<string>(existingGroup?.name ?? '');
    const [photoLocalUri, setPhotoLocalUri] = useState<string | null>(null);
    const [photoUrl, setPhotoUrl] = useState<string>(existingGroup?.photoUrl ?? '');
    const [memberLimit, setMemberLimit] = useState<string>(
        existingGroup ? String(existingGroup.memberLimit) : '5',
    );
    const [notificationPolicy, setNotificationPolicy] = useState<NotificationPolicy>(
        existingGroup?.notificationPolicy ?? 'all_group_messages',
    );
    const [members, setMembers] = useState<ChatUser[]>([]);
    const [showMemberPicker, setShowMemberPicker] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingMembers, setLoadingMembers] = useState<boolean>(Boolean(existingGroup));
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!existingGroup) {
            setMembers([currentUser]);
            setLoadingMembers(false);
            return;
        }

        let isMounted = true;

        getUsersByIds(existingGroup.memberIds)
            .then((users) => {
                if (isMounted) {
                    setMembers(users);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setError('Não foi possível carregar os integrantes do grupo');
                }
            })
            .finally(() => {
                if (isMounted) {
                    setLoadingMembers(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [existingGroup, currentUser]);

    const memberLimitNumber = useMemo(() => Number.parseInt(memberLimit, 10), [memberLimit]);
    const slots = useMemo(
        () => availableSlots({ memberIds: members.map((member) => member.uid), memberLimit: memberLimitNumber || 0 }),
        [members, memberLimitNumber],
    );

    const handlePickPhoto = async () => {
        setError(null);

        try {
            const uri = await pickImageFromLibrary();

            if (uri) {
                setPhotoLocalUri(uri);
            }
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Não foi possível selecionar a foto');
        }
    };

    const handleToggleMember = (user: ChatUser) => {
        setMembers((currentMembers) => {
            const alreadySelected = currentMembers.some((member) => member.uid === user.uid);

            if (alreadySelected) {
                return currentMembers.filter((member) => member.uid !== user.uid);
            }

            return [...currentMembers, user];
        });
    };

    const handleRemoveExistingMember = async (member: ChatUser) => {
        if (!existingGroup) {
            return;
        }

        setError(null);

        try {
            await removeMember(existingGroup.id, member.uid);
            setMembers((currentMembers) => currentMembers.filter((item) => item.uid !== member.uid));
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Não foi possível remover o integrante');
        }
    };

    const handleSave = async () => {
        setError(null);

        if (!name.trim()) {
            setError('Informe o nome do grupo');
            return;
        }

        if (!Number.isInteger(memberLimitNumber) || memberLimitNumber < 2) {
            setError('O limite de integrantes deve ser um número inteiro válido (mínimo 2)');
            return;
        }

        setLoading(true);

        try {
            let finalPhotoUrl = photoUrl;

            if (existingGroup && photoLocalUri) {
                finalPhotoUrl = await uploadGroupPhoto(existingGroup.id, photoLocalUri);
                await updateGroupPhoto(existingGroup.id, finalPhotoUrl);
            }

            if (existingGroup) {
                if (memberLimitNumber !== existingGroup.memberLimit) {
                    await updateMemberLimit(existingGroup.id, memberLimitNumber);
                }

                if (notificationPolicy !== existingGroup.notificationPolicy) {
                    await updateNotificationPolicy(existingGroup.id, notificationPolicy);
                }

                const newMemberIds = members
                    .map((member) => member.uid)
                    .filter((uid) => !existingGroup.memberIds.includes(uid));

                for (const uid of newMemberIds) {
                    await addMember(existingGroup.id, uid);
                }

                onSaved({
                    ...existingGroup,
                    name: name.trim(),
                    photoUrl: finalPhotoUrl,
                    memberLimit: memberLimitNumber,
                    notificationPolicy,
                    memberIds: members.map((member) => member.uid),
                });
                return;
            }

            const group = await createGroup({
                name: name.trim(),
                photoUrl: finalPhotoUrl,
                ownerId: currentUser.uid,
                memberIds: members.map((member) => member.uid),
                memberLimit: memberLimitNumber,
                notificationPolicy,
            });

            if (photoLocalUri) {
                const uploadedPhotoUrl = await uploadGroupPhoto(group.id, photoLocalUri);
                await updateGroupPhoto(group.id, uploadedPhotoUrl);
                onSaved({ ...group, photoUrl: uploadedPhotoUrl });
                return;
            }

            onSaved(group);
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Não foi possível salvar o grupo');
        } finally {
            setLoading(false);
        }
    };

    if (showMemberPicker) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Pressable style={styles.backButton} onPress={() => setShowMemberPicker(false)}>
                        <Text style={styles.backText}>Concluir</Text>
                    </Pressable>
                    <Text style={styles.title}>Selecionar integrantes</Text>
                </View>
                <View style={styles.pickerContent}>
                    <UsersScreen
                        currentUser={currentUser}
                        selectedUserIds={members.map((member) => member.uid)}
                        onSelectUser={handleToggleMember}
                    />
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={onBack}>
                    <Text style={styles.backText}>Voltar</Text>
                </Pressable>
                <Text style={styles.title}>{isEditing ? 'Editar grupo' : 'Criar grupo'}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Pressable style={styles.photoPicker} onPress={handlePickPhoto} disabled={!isOwner}>
                    <Avatar name={name || '?'} photoUrl={photoLocalUri ?? photoUrl} size={72} />
                    <Text style={styles.photoPickerLabel}>Escolher foto do grupo</Text>
                </Pressable>

                <TextInput
                    style={styles.input}
                    placeholder="Nome do grupo"
                    placeholderTextColor="#64748B"
                    value={name}
                    onChangeText={setName}
                    editable={isOwner}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Limite de integrantes"
                    placeholderTextColor="#64748B"
                    value={memberLimit}
                    onChangeText={setMemberLimit}
                    keyboardType="number-pad"
                    editable={isOwner}
                />

                <Text style={styles.slotsText}>
                    {members.length} integrante(s) · {slots} vaga(s) disponível(is)
                </Text>

                <Text style={styles.sectionTitle}>Política de notificação</Text>
                <View style={styles.policyList}>
                    {POLICY_OPTIONS.map((option) => (
                        <Pressable
                            key={option.value}
                            style={[
                                styles.policyOption,
                                notificationPolicy === option.value && styles.policyOptionSelected,
                            ]}
                            onPress={() => isOwner && setNotificationPolicy(option.value)}
                        >
                            <Text style={styles.policyOptionText}>{option.label}</Text>
                        </Pressable>
                    ))}
                </View>

                <View style={styles.membersHeader}>
                    <Text style={styles.sectionTitle}>Integrantes</Text>
                    {isOwner ? (
                        <Pressable onPress={() => setShowMemberPicker(true)}>
                            <Text style={styles.addMembersText}>Adicionar</Text>
                        </Pressable>
                    ) : null}
                </View>

                {loadingMembers ? (
                    <ActivityIndicator color="#38BDF8" />
                ) : (
                    <View style={styles.membersList}>
                        {members.map((member) => (
                            <GroupMemberItem
                                key={member.uid}
                                member={member}
                                isOwner={existingGroup ? isGroupOwner(existingGroup, member.uid) : member.uid === currentUser.uid}
                                onRemove={
                                    isEditing && isOwner && member.uid !== currentUser.uid
                                        ? handleRemoveExistingMember
                                        : undefined
                                }
                            />
                        ))}
                    </View>
                )}

                {error ? <ErrorMessage message={error} /> : null}

                <Pressable style={styles.primaryButton} onPress={handleSave} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#082F49" />
                    ) : (
                        <Text style={styles.primaryButtonText}>{isEditing ? 'Salvar alterações' : 'Criar grupo'}</Text>
                    )}
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        gap: 12,
    },
    backButton: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: '#111827',
    },
    backText: {
        color: '#E2E8F0',
        fontWeight: '700',
    },
    title: {
        color: '#F8FAFC',
        fontSize: 20,
        fontWeight: '700',
    },
    pickerContent: {
        flex: 1,
        padding: 16,
    },
    scrollContent: {
        padding: 20,
        gap: 14,
    },
    photoPicker: {
        alignItems: 'center',
        gap: 8,
    },
    photoPickerLabel: {
        color: '#38BDF8',
        fontSize: 13,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#0B1220',
        color: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    slotsText: {
        color: '#94A3B8',
        fontSize: 13,
    },
    sectionTitle: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '700',
        marginTop: 8,
    },
    policyList: {
        gap: 8,
    },
    policyOption: {
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 12,
        padding: 12,
    },
    policyOptionSelected: {
        borderColor: '#38BDF8',
        backgroundColor: '#0C2233',
    },
    policyOptionText: {
        color: '#E2E8F0',
        fontSize: 14,
    },
    membersHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    addMembersText: {
        color: '#38BDF8',
        fontWeight: '700',
    },
    membersList: {
        gap: 8,
    },
    primaryButton: {
        minHeight: 52,
        borderRadius: 14,
        backgroundColor: '#38BDF8',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    primaryButtonText: {
        color: '#082F49',
        fontWeight: '700',
        fontSize: 16,
    },
});
