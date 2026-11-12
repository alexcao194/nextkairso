"use client";

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { patchUsersMe } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/lib/toast/ToastProvider";
import { uploadFile } from "@/lib/upload";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Field, Input, Textarea } from "@/components/ui/form";
import { tr } from "@/lib/i18n";

export function ProfileDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={tr().profile.title} width={480}>
      <Form onClose={onClose} />
    </Modal>
  );
}

const toDateInput = (v?: string) => (v ? v.slice(0, 10) : "");

function Form({ onClose }: { onClose: () => void }) {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [alias, setAlias] = useState(user?.alias ?? "");
  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [birthday, setBirthday] = useState(toDateInput(user?.birthday));
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const save = useMutation({
    mutationFn: () =>
      patchUsersMe({
        name: name.trim(),
        alias: alias.trim(),
        nickname: nickname.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        birthday,
        avatar,
      }),
    onSuccess: (u) => {
      setUser(u);
      toast.success(tr().profile.saved);
      onClose();
    },
    onError: (e) => toast.error(e),
  });

  const pickAvatar = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      setAvatar((await uploadFile(file, "user", user?.id)).fileUrl);
    } catch (e) {
      toast.error(e);
    } finally {
      setUploading(false);
    }
  };

  const aliasOk = /^[a-zA-Z0-9_.-]{3,}$/.test(alias);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim() && aliasOk) save.mutate();
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex items-center gap-3">
        <Avatar person={{ id: user?.id, name, avatar }} size="xl" />
        <div className="flex flex-col gap-1.5">
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" aria-label={tr().profile.pickAvatar} onChange={(e) => pickAvatar(e.target.files?.[0])} />
          <Button size="sm" loading={uploading} onClick={() => fileRef.current?.click()}>
            {tr().profile.changePhoto}
          </Button>
          {avatar && (
            <Button size="sm" variant="ghost" onClick={() => setAvatar("")}>
              {tr().profile.removePhoto}
            </Button>
          )}
        </div>
      </div>
      <Field label={tr().profile.fullName} required>
        {(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} />}
      </Field>
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <Field label={tr().profile.alias} required error={alias && !aliasOk ? tr().profile.aliasHint : null}>
          {(p) => <Input {...p} value={alias} onChange={(e) => setAlias(e.target.value)} />}
        </Field>
        <Field label={tr().profile.nickname}>{(p) => <Input {...p} value={nickname} onChange={(e) => setNickname(e.target.value)} />}</Field>
        <Field label={tr().profile.phone}>{(p) => <Input {...p} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />}</Field>
        <Field label={tr().profile.birthday}>{(p) => <Input {...p} type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />}</Field>
      </div>
      <Field label={tr().profile.bio}>{(p) => <Textarea {...p} value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />}</Field>
      <Field label="Email" hint={tr().profile.emailHint}>
        {(p) => <Input {...p} value={user?.email ?? ""} disabled readOnly />}
      </Field>
      <div className="flex justify-end gap-2">
        <Button onClick={onClose}>{tr().profile.cancel}</Button>
        <Button type="submit" variant="primary" loading={save.isPending} disabled={!name.trim() || !aliasOk}>
          {tr().profile.save}
        </Button>
      </div>
    </form>
  );
}
